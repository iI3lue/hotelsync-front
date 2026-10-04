"use client";

import type { Availability, Hotel, PhysicalRoom, RoomType } from "./api";
import { authHeader } from "./auth-client";

/**
 * Capa de acceso a datos para Client Components.
 *
 * A diferencia de `@/lib/api` (server-only: URLs directas al backend +
 * `cache` de React), estas funciones pegan a los rewrites `/api/*` de
 * Next (mismo origen, sin CORS) y aplican timeout de 3s por llamada
 * (documento de arquitectura §6.5). Si hay sesión, se adjunta el Bearer.
 */

async function clientFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { ...authHeader() },
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

export async function clientPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
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
