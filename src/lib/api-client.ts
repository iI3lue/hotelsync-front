"use client";

import type {
  Availability,
  Hotel,
  PhysicalRoom,
  RoomAssignment,
  RoomType,
} from "./api";
import { authHeader } from "./auth-client";
import {
  backoffDelay,
  isRetryableError,
  timeoutSignal,
} from "./timeout-signal";

/**
 * Capa de acceso a datos para Client Components.
 *
 * A diferencia de `@/lib/api` (server-only: URLs directas al backend +
 * `cache` de React), estas funciones pegan a los rewrites `/api/*` de
 * Next (mismo origen, sin CORS).
 *
 * Resiliencia para wifi inestable y backends free que despiertan lento:
 * - Timeout 10s por defecto (30s en operaciones largas: disponibilidad
 *   por rango y reserva, que despiertan al R&A/booking dormidos).
 * - 1 reintento con backoff+jitter en GETs ante fallo de red/timeout.
 *   POST/PUT nunca se reintentan (evita doble reserva/cargo).
 * - `timeoutSignal` con fallback para iPhones viejos sin
 *   `AbortSignal.timeout` (Baseline 2024).
 */

export interface RequestOptions {
  /** Timeout por intento en ms. GET: 10000, operaciones largas: 30000. */
  timeoutMs?: number;
  /** Reintentos ante fallo de red/timeout. Solo GET/HEAD (defecto 1). */
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;
export const LONG_TIMEOUT_MS = 30_000;

let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", {
      method: "POST",
      signal: timeoutSignal(5000),
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function isIdempotent(init: Omit<RequestInit, "signal">): boolean {
  const method = (init.method ?? "GET").toUpperCase();
  return method === "GET" || method === "HEAD";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithSession(
  url: string,
  init: Omit<RequestInit, "signal"> = {},
  opts: RequestOptions = {}
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  // Solo GET/HEAD se reintentan: un POST reintentado duplicaría la
  // operación (doble reserva, doble cargo) si el primero sí llegó.
  const maxRetries = opts.retries ?? (isIdempotent(init) ? 1 : 0);
  let attempt = 0;
  for (;;) {
    const send = () =>
      fetch(url, { ...init, signal: timeoutSignal(timeoutMs) });
    try {
      const first = await send();
      if (first.status !== 401 || !(await refreshSession())) return first;
      // A retry is safe: authenticated routes reject a missing/expired Bearer
      // before running their controller, so the original operation did not run.
      return send();
    } catch (err) {
      if (attempt >= maxRetries || !isRetryableError(err)) throw err;
      attempt += 1;
      await sleep(backoffDelay(attempt - 1));
    }
  }
}

async function clientFetch<T>(url: string, opts: RequestOptions = {}): Promise<T> {
  const res = await fetchWithSession(
    url,
    {
      headers: { ...authHeader() },
    },
    opts
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

export async function clientPost<T>(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
  opts: RequestOptions = {}
): Promise<T> {
  const res = await fetchWithSession(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...headers,
      },
      body: JSON.stringify(body),
    },
    // Los POST nunca se reintentan (ver fetchWithSession); solo se les
    // puede dar más timeout para backends dormidos.
    { ...opts, retries: 0 }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

export async function fetchHotels(): Promise<Hotel[]> {
  return clientFetch<Hotel[]>("/api/property/hotels");
}

export async function fetchRoomTypes(hotelId: string): Promise<RoomType[]> {
  return clientFetch<RoomType[]>(
    `/api/property/hotels/${encodeURIComponent(hotelId)}/room-types`
  );
}

export async function createHotel(data: {
  name: string;
  address?: string;
  city: string;
  country: string;
  timezone: string;
  image_url?: string;
}): Promise<Hotel> {
  return clientPost<Hotel>("/api/property/hotels", data);
}

export async function updateHotel(
  id: string,
  data: Partial<Pick<Hotel, "name" | "address" | "city" | "country" | "timezone" | "image_url">>
): Promise<Hotel> {
  return putJson<Hotel>(`/api/property/hotels/${encodeURIComponent(id)}`, data);
}

export async function createRoomType(data: {
  hotel_id: string;
  name: string;
  capacity: number;
  base_rate: number;
  amenities: string[];
  image_url?: string;
}): Promise<RoomType> {
  return clientPost<RoomType>("/api/property/room-types", data);
}

export async function updateRoomType(
  id: string,
  data: Partial<Pick<RoomType, "name" | "capacity" | "base_rate" | "amenities" | "image_url">>
): Promise<RoomType> {
  return putJson<RoomType>(`/api/property/room-types/${encodeURIComponent(id)}`, data);
}

export async function fetchMyBookings(): Promise<import("./api").Booking[]> {
  return clientFetch<import("./api").Booking[]>("/api/booking/bookings/me");
}

export async function fetchPhysicalRooms(
  hotelId: string
): Promise<PhysicalRoom[]> {
  return clientFetch<PhysicalRoom[]>(
    `/api/property/hotels/${encodeURIComponent(hotelId)}/rooms`
  );
}

export interface CleaningTask {
  history_id: string;
  room_status_id: string;
  booking_id: string;
  hotel_id: string;
  physical_room_id?: string | null;
  room_number: string;
  status: string;
  assigned_to?: string | null;
  assigned_to_user_id?: string | null;
  created_at: string;
}

export async function fetchMyTasks(status?: string): Promise<CleaningTask[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return clientFetch<CleaningTask[]>(`/api/housekeeping/tasks/mine${query}`);
}

export async function fetchHotelTasks(
  hotelId: string,
  status?: string
): Promise<CleaningTask[]> {
  const params = new URLSearchParams({ hotel_id: hotelId });
  if (status) params.set("status", status);
  return clientFetch<CleaningTask[]>(`/api/housekeeping/tasks?${params}`);
}

export async function assignCleaningTask(
  taskId: string,
  assignedToUserId: string
): Promise<CleaningTask> {
  return clientPost<CleaningTask>(`/api/housekeeping/tasks/${taskId}/assign`, {
    assigned_to_user_id: assignedToUserId,
  });
}

async function putJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body),
    signal: timeoutSignal(DEFAULT_TIMEOUT_MS),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

export async function transitionCleaningTask(
  taskId: string,
  action: "start" | "complete"
): Promise<CleaningTask> {
  return putJson<CleaningTask>(`/api/housekeeping/tasks/${taskId}/${action}`, {});
}

export async function createPhysicalRoom(data: {
  hotel_id: string;
  room_type_id: string;
  room_number: string;
  available_from: string;
}): Promise<PhysicalRoom> {
  return clientPost<PhysicalRoom>(
    `/api/property/hotels/${encodeURIComponent(data.hotel_id)}/rooms`,
    {
      room_type_id: data.room_type_id,
      room_number: data.room_number,
      available_from: data.available_from,
    }
  );
}

export async function fetchAvailability(
  roomTypeId: string,
  date: string
): Promise<Availability> {
  return clientFetch<Availability>(
    `/api/rate/availability?room_type_id=${encodeURIComponent(roomTypeId)}&date=${encodeURIComponent(date)}`,
    // Despierta al R&A dormido: operación larga de lectura.
    { timeoutMs: LONG_TIMEOUT_MS }
  );
}

/**
 * Disponibilidad de un rango en UN solo request (el calendario pide el mes
 * entero en vez de un GET por día). Máximo 62 noches por llamada.
 */
export async function fetchAvailabilityRange(
  roomTypeId: string,
  from: string,
  to: string
): Promise<Record<string, Availability>> {
  return clientFetch<Record<string, Availability>>(
    `/api/rate/availability/range?room_type_id=${encodeURIComponent(roomTypeId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    // Despierta al R&A dormido: operación larga de lectura.
    { timeoutMs: LONG_TIMEOUT_MS }
  );
}

export async function blockInventory(data: {
  room_type_id: string;
  date: string;
  count: number;
  action: "block" | "unblock";
}): Promise<Availability> {
  return clientPost<Availability>("/api/rate/blocks", data);
}

/** POST genérico para acciones (check-in/out, confirm/cancel, etc.). */
export async function postJson<T>(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
  opts: RequestOptions = {}
): Promise<T> {
  return clientPost<T>(url, body, headers, opts);
}

export async function fetchHotelByIdClient(hotelId: string): Promise<Hotel> {
  return clientFetch<Hotel>(
    `/api/property/hotels/${encodeURIComponent(hotelId)}`
  );
}

/** Asignación de habitación de una reserva (404 si no tiene check-in). */
export async function fetchAssignment(
  bookingId: string
): Promise<RoomAssignment> {
  return clientFetch<RoomAssignment>(
    `/api/front-desk/check-in/${encodeURIComponent(bookingId)}`
  );
}

export interface BillingCharge {
  charge_id: string;
  concept: string;
  amount: number | string;
  category: string;
  added_at: string;
}

export interface BillingInvoice {
  invoice_id: string;
  invoice_number: string;
  subtotal: number | string;
  tax_rate: number | string;
  tax_amount: number | string;
  total: number | string;
  currency: string;
  country: string;
  issued_at: string;
}

export interface BillingFolio {
  folio_id: string;
  booking_id: string;
  hotel_id: string;
  guest_id: string;
  currency: string;
  total: number | string;
  status: string;
  charges: BillingCharge[];
  invoice: BillingInvoice | null;
}

/** Folio de una reserva con cargos y factura (si ya cerró). */
export async function fetchFolioByBooking(
  bookingId: string
): Promise<BillingFolio> {
  return clientFetch<BillingFolio>(
    `/api/billing/folios/by-booking/${encodeURIComponent(bookingId)}`
  );
}

export interface HousekeepingRoomStatus {
  room_status_id: string;
  hotel_id: string;
  room_number: string;
  status: string;
  assigned_to: string | null;
  updated_at: string;
}

export interface HousekeepingTask {
  history_id: string;
  booking_id: string;
  hotel_id: string;
  room_number: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
}

/** Estado de habitaciones físicas de un hotel (HK-1). */
export async function fetchRoomStatus(
  hotelId: string
): Promise<HousekeepingRoomStatus[]> {
  return clientFetch<HousekeepingRoomStatus[]>(
    `/api/housekeeping/rooms/status?hotel_id=${encodeURIComponent(hotelId)}`
  );
}

/** Tareas de limpieza de un hotel (HK-2, HK-3). */
export async function fetchCleaningTasks(
  hotelId: string
): Promise<HousekeepingTask[]> {
  return clientFetch<HousekeepingTask[]>(
    `/api/housekeeping/tasks?hotel_id=${encodeURIComponent(hotelId)}`
  );
}

// ─── Staff (SUPER_ADMIN global; MANAGER en su hotel) ───

export interface StaffAssignment {
  assignment_id: string;
  user_id: string;
  role: string;
  hotel_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StaffMember {
  user_id: string;
  email: string;
  name: string;
  phone: string | null;
  picture_url: string | null;
  status: string;
  email_verified: boolean;
  assignments: StaffAssignment[];
}

export interface CreateStaffInput {
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: string;
  hotel_id?: string;
}

export interface StaffCreated {
  user: StaffMember;
  initial_password?: string;
}

export async function fetchStaff(
  query?: { hotel_id?: string; role?: string }
): Promise<StaffMember[]> {
  const params = new URLSearchParams();
  if (query?.hotel_id) params.set("hotel_id", query.hotel_id);
  if (query?.role) params.set("role", query.role);
  const qs = params.toString();
  return clientFetch<StaffMember[]>(`/api/users/staff${qs ? `?${qs}` : ""}`);
}

export async function createStaff(
  data: CreateStaffInput
): Promise<StaffCreated> {
  return clientPost<StaffCreated>("/api/users/staff", data);
}

export async function updateStaff(
  userId: string,
  data: { name?: string; phone?: string; status?: string }
): Promise<StaffMember> {
  const res = await fetchWithSession(
    `/api/users/staff/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    { retries: 0 }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
  return res.json() as Promise<StaffMember>;
}

// ─── Personal de un hotel (SUPER_ADMIN en cualquiera, MANAGER en el suyo) ───

export interface CreateHotelStaffInput {
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: string;
}

export async function fetchHotelStaff(
  hotelId: string,
  query?: { role?: string }
): Promise<StaffMember[]> {
  const params = new URLSearchParams();
  if (query?.role) params.set("role", query.role);
  const qs = params.toString();
  return clientFetch<StaffMember[]>(
    `/api/users/hotels/${encodeURIComponent(hotelId)}/staff${qs ? `?${qs}` : ""}`
  );
}

export async function createHotelStaff(
  hotelId: string,
  data: CreateHotelStaffInput
): Promise<StaffCreated> {
  return clientPost<StaffCreated>(
    `/api/users/hotels/${encodeURIComponent(hotelId)}/staff`,
    data
  );
}

export async function setHotelStaffActive(
  hotelId: string,
  userId: string,
  isActive: boolean
): Promise<StaffAssignment> {
  const res = await fetchWithSession(
    `/api/users/hotels/${encodeURIComponent(hotelId)}/staff/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive }),
    },
    { retries: 0 }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
  return res.json() as Promise<StaffAssignment>;
}
