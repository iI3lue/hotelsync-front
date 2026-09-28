"use client";

import useSWR from "swr";
import type { RoomType } from "@/lib/api";
import { fetchRoomTypes } from "@/lib/api-client";

/**
 * Nombres de tipos de habitación por hotel con caché SWR compartida:
 * todos los componentes que pidan el mismo hotel comparten 1 solo
 * request (dedupingInterval) en vez de fetchear cada uno por su cuenta.
 */
export function useRoomNames(hotelId: string): Record<string, string> {
  const { data } = useSWR<RoomType[]>(
    hotelId ? `room-names:${hotelId}` : null,
    () => fetchRoomTypes(hotelId),
    { dedupingInterval: 60000, revalidateOnFocus: false }
  );

  const names: Record<string, string> = {};
  for (const r of data ?? []) names[r.room_type_id] = r.name;
  return names;
}
