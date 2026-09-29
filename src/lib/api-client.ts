"use client";

import type { Availability, Hotel, RoomType } from "./api";

/**
 * Capa de acceso a datos para Client Components.
 *
 * A diferencia de `@/lib/api` (server-only: URLs directas al backend +
 * `cache` de React), estas funciones pegan a los rewrites `/api/*` de
 * Next (mismo origen, sin CORS) y aplican timeout de 3s por llamada
 * (documento de arquitectura §6.5).
 */

async function clientFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

export async function clientPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(3000),
  });
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
  city: string;
  country: string;
  timezone: string;
}): Promise<Hotel> {
  return clientPost<Hotel>("/api/property/hotels", data);
}

export async function createRoomType(data: {
  hotel_id: string;
  name: string;
  capacity: number;
  base_rate: number;
  amenities: string[];
}): Promise<RoomType> {
  return clientPost<RoomType>("/api/property/room-types", data);
}

export async function fetchAvailability(
  roomTypeId: string,
  date: string
): Promise<Availability> {
  return clientFetch<Availability>(
    `/api/rate/availability?room_type_id=${encodeURIComponent(roomTypeId)}&date=${encodeURIComponent(date)}`
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
    `/api/rate/availability/range?room_type_id=${encodeURIComponent(roomTypeId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
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
export async function postJson<T>(url: string, body: unknown): Promise<T> {
  return clientPost<T>(url, body);
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
