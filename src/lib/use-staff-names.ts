"use client";

import useSWR from "swr";
import { fetchHotelStaff, type StaffMember } from "@/lib/api-client";

/**
 * Camaristas del hotel (personal de limpieza) con caché SWR compartida:
 * el select de asignación y la etiqueta "Asignada a" reusan un solo
 * request por hotel en vez de pedir el listado por cada fila.
 */
export function useStaffNames(hotelId: string): {
  list: StaffMember[];
  names: Record<string, string>;
} {
  const { data } = useSWR<StaffMember[]>(
    hotelId ? `staff-names:${hotelId}:HOUSEKEEPER` : null,
    () => fetchHotelStaff(hotelId, { role: "HOUSEKEEPER" }),
    { dedupingInterval: 60000, revalidateOnFocus: false }
  );

  const list = data ?? [];
  const names: Record<string, string> = {};
  for (const member of list) names[member.user_id] = member.name;
  return { list, names };
}
