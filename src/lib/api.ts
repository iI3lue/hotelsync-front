import { cache } from "react";
import { timeoutSignal } from "./timeout-signal";
import type {
  HotelFilters,
  SearchState,
  StayAvailability,
  StayInfo,
  StockLookup,
} from "./format";

/**
 * Capa de acceso a datos SOLO SERVIDOR (RSC, Server Actions, route handlers).
 * Usa URLs directas al backend + `cache` de React. Los Client Components
 * deben usar `@/lib/api-client` (rewrites /api/*) y `@/lib/format`
 * (helpers puros); importar este módulo en el browser rompe el bundle.
 *
 * Todo request lleva timeout (`API_TIMEOUT_MS`). Sin él, un RSC que espera a
 * un servicio Render free dormido se cuelga hasta que la plataforma corta la
 * función (504, página en blanco); con él, el `catch` del caller degrada
 * antes de ese corte.
 */
export type { HotelFilters, SearchState, StayAvailability, StayInfo, StockLookup };
export {
  applyStayAvailability,
  filterHotels,
  formatDate,
  formatPrice,
  hotelStayAvailability,
  matchScore,
  minRate,
  normalizeText,
  rankHotelsByRelevance,
  searchQuery,
  stayNights,
  suggestHotel,
  withSearch,
} from "./format";

const PROPERTY_API = process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:3001/v1";
const RATE_API = process.env.NEXT_PUBLIC_RATE_API_URL || "http://localhost:3002/v1";
const BOOKING_API = process.env.NEXT_PUBLIC_BOOKING_API_URL || "http://localhost:3004/v1";
const FRONT_DESK_API = process.env.NEXT_PUBLIC_FRONT_DESK_API_URL || "http://localhost:3005/v1";

/**
 * Timeout por request server-side. Se mantiene por debajo del límite de
 * duración de función de Vercel (10s por defecto en Hobby) para que nuestro
 * corte llegue ANTES que el de la plataforma. Overridable por env si el plan
 * permite funciones más largas.
 */
const API_TIMEOUT_MS = Number(process.env.API_FETCH_TIMEOUT_MS) || 8000;

/**
 * `fetch` server-side con timeout. No reintenta: en SSR un reintento duplica
 * la espera y puede pasarse del límite de la función; el caller degrada.
 */
function timedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: timeoutSignal(API_TIMEOUT_MS) });
}

export interface Hotel {
  hotel_id: string;
  name: string;
  address?: string | null;
  city: string;
  country: string;
  timezone: string;
  image_url?: string | null;
  roomTypes: RoomType[];
  cancellationPolicies: CancellationPolicy[];
}

export interface RoomType {
  room_type_id: string;
  hotel_id: string;
  name: string;
  capacity: number;
  base_rate: number;
  amenities: string[];
  image_url?: string | null;
}

export interface PhysicalRoom {
  physical_room_id: string;
  hotel_id: string;
  room_type_id: string;
  room_number: string;
  available_from: string;
  is_active: boolean;
  roomType: Pick<RoomType, "room_type_id" | "name">;
}

export interface CancellationPolicy {
  policy_id: string;
  hotel_id: string;
  name: string;
  description: string;
}

export interface Availability {
  available: number;
  blocked: number;
}

export interface Booking {
  booking_id: string;
  guest_id: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  booked_by_user_id: string | null;
  hotel_id: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  status: "pending" | "confirmed" | "cancelled";
  channel: "direct" | "ota" | "phone";
  total_amount: number | string;
  /** Estado del cobro, independiente de `status` (payment-service). */
  payment_status?: PaymentStatus;
  payment_method_preference?: PaymentMethodPreference;
  paid_at?: string | null;
}

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED";
export type PaymentMethodPreference = "ONLINE" | "RECEPTION";

/** Respuesta del alta: incluye el manage token una sola vez. */
export interface BookingCreated extends Booking {
  manage_token: string;
}

/** Alias de compatibilidad con el admin original. */
export type BookingRef = Booking & {
  status: Booking["status"] | (string & {});
  channel: Booking["channel"] | (string & {});
  guest_name?: string | null;
};

export interface RoomAssignment {
  assignment_id: string;
  booking_id: string;
  physical_room_id?: string | null;
  physical_room_number: string;
  checked_in_at: string;
  checked_out_at: string | null;
}

export interface GuestIncident {
  incident_id: string;
  booking_id: string;
  description: string;
  status: string;
  created_at: string;
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await timedFetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await timedFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API error: ${res.status}`);
  }
  return res.json();
}

async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await timedFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API error: ${res.status}`);
  }
  return res.json();
}

export { apiPut };

export async function fetchHotels(): Promise<Hotel[]> {
  return cachedFetchHotels();
}

export async function fetchHotelById(id: string): Promise<Hotel> {
  return cachedFetchHotelById(id);
}

export async function fetchRoomTypes(hotelId: string): Promise<RoomType[]> {
  return cachedFetchRoomTypes(hotelId);
}

export async function fetchPhysicalRooms(hotelId: string): Promise<PhysicalRoom[]> {
  return apiFetch<PhysicalRoom[]>(
    `${PROPERTY_API}/hotels/${encodeURIComponent(hotelId)}/rooms`
  );
}

// Per-request dedup (server-cache-react): misma URL = 1 solo viaje al backend.
const cachedFetchHotels = cache(async (): Promise<Hotel[]> => {
  return apiFetch<Hotel[]>(`${PROPERTY_API}/hotels`);
});

const cachedFetchHotelById = cache(async (id: string): Promise<Hotel> => {
  return apiFetch<Hotel>(`${PROPERTY_API}/hotels/${id}`);
});

const cachedFetchRoomTypes = cache(async (hotelId: string): Promise<RoomType[]> => {
  return apiFetch<RoomType[]>(`${PROPERTY_API}/hotels/${hotelId}/room-types`);
});

export async function createHotel(data: {
  name: string;
  city: string;
  country: string;
  timezone: string;
}): Promise<Hotel> {
  return apiPost<Hotel>(`${PROPERTY_API}/hotels`, data);
}

export async function createRoomType(data: {
  hotel_id: string;
  name: string;
  capacity: number;
  base_rate: number;
  amenities: string[];
}): Promise<RoomType> {
  return apiPost<RoomType>(`${PROPERTY_API}/room-types`, data);
}

export async function fetchAvailability(
  roomTypeId: string,
  date: string
): Promise<Availability> {
  return apiFetch<Availability>(
    `${RATE_API}/availability?room_type_id=${roomTypeId}&date=${date}`
  );
}

/**
 * Disponibilidad de un rango en un solo request (mismo endpoint que usa el
 * calendario). `to` es inclusivo en el backend; para estancias se consulta
 * hasta la fecha de check-out y solo se leen las noches ocupadas.
 */
export async function fetchAvailabilityRange(
  roomTypeId: string,
  from: string,
  to: string
): Promise<Record<string, Availability>> {
  return apiFetch<Record<string, Availability>>(
    `${RATE_API}/availability/range?room_type_id=${encodeURIComponent(
      roomTypeId
    )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
}

const STAY_CONCURRENCY = 6;

/**
 * Construye una consulta de stock para un rango de fechas a partir del
 * endpoint existente, con concurrencia acotada.
 *
 * El endpoint reporta `available: 0` tanto para fechas sin fila de inventario
 * como para fechas realmente agotadas. Un room type cuyo rango entero es 0 se
 * trata como "sin inventario cargado" (devuelve `undefined`) para que la
 * búsqueda no excluya hoteles por datos faltantes.
 */
export async function buildStockLookup(
  roomTypes: RoomType[],
  from: string,
  to: string
): Promise<StockLookup> {
  const data = new Map<string, Record<string, Availability>>();
  const queue = [...roomTypes];
  const workers = Array.from(
    { length: Math.min(STAY_CONCURRENCY, Math.max(queue.length, 1)) },
    async () => {
      while (queue.length > 0) {
        const roomType = queue.shift();
        if (!roomType) break;
        try {
          const range = await fetchAvailabilityRange(
            roomType.room_type_id,
            from,
            to
          );
          data.set(roomType.room_type_id, range);
        } catch {
          // Sin datos: se degrada a "unknown" en vez de excluir hoteles.
        }
      }
    }
  );
  await Promise.all(workers);

  const managed = new Set<string>();
  for (const [roomTypeId, range] of data) {
    const anyPositive = Object.values(range).some((day) => (day.available ?? 0) > 0);
    if (anyPositive) managed.add(roomTypeId);
  }

  return (roomTypeId: string, iso: string) => {
    if (!managed.has(roomTypeId)) return undefined;
    return data.get(roomTypeId)?.[iso]?.available;
  };
}

export async function blockInventory(data: {
  room_type_id: string;
  date: string;
  count: number;
  action: "block" | "unblock";
}): Promise<Availability> {
  return apiPost<Availability>(`${RATE_API}/blocks`, data);
}

export async function fetchArrivals(
  hotelId: string,
  date: string
): Promise<BookingRef[]> {
  return apiFetch<BookingRef[]>(
    `${FRONT_DESK_API}/arrivals?hotel_id=${hotelId}&date=${date}`
  );
}

export async function checkInBooking(data: {
  booking_id: string;
  physical_room_number: string;
}): Promise<RoomAssignment> {
  return apiPost<RoomAssignment>(`${FRONT_DESK_API}/check-in`, data);
}

export async function checkOutBooking(bookingId: string): Promise<RoomAssignment> {
  return apiPost<RoomAssignment>(`${FRONT_DESK_API}/check-out`, {
    booking_id: bookingId,
  });
}

export async function fetchIncidents(bookingId?: string): Promise<GuestIncident[]> {
  const query = bookingId ? `?booking_id=${bookingId}` : "";
  return apiFetch<GuestIncident[]>(`${FRONT_DESK_API}/incidents${query}`);
}

export async function fetchBookingById(id: string): Promise<Booking> {
  return apiFetch<Booking>(`${BOOKING_API}/bookings/${id}`);
}

export interface BookingsQuery {
  hotel_id?: string;
  status?: "pending" | "confirmed" | "cancelled";
  date?: string;
}

export async function fetchBookings(query: BookingsQuery = {}): Promise<BookingRef[]> {
  const params = new URLSearchParams();
  if (query.hotel_id) params.set("hotel_id", query.hotel_id);
  if (query.status) params.set("status", query.status);
  if (query.date) params.set("date", query.date);
  const qs = params.toString();
  return apiFetch<BookingRef[]>(`${BOOKING_API}/bookings${qs ? `?${qs}` : ""}`);
}
