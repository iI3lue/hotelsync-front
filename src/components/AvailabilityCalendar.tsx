"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { es } from "react-day-picker/locale";
import { fromIsoDate, toIsoDate } from "@/lib/dates";
import { prefetchMonth, useMonthAvailability } from "@/lib/use-availability";

interface AvailabilityCalendarProps {
  /** Si se pasa, cada día muestra su stock y los días sin stock se deshabilitan. */
  roomTypeId?: string;
  /** Fecha seleccionada en formato YYYY-MM-DD. */
  selected?: string;
  onSelect: (iso: string) => void;
  /** Fecha mínima elegible en formato YYYY-MM-DD (por defecto hoy). */
  minDate?: string;
  id?: string;
}

export default function AvailabilityCalendar({
  roomTypeId,
  selected,
  onSelect,
  minDate,
  id,
}: AvailabilityCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const min = minDate ? (fromIsoDate(minDate) ?? today) : today;
  const selectedDate = selected ? fromIsoDate(selected) : undefined;

  const [month, setMonth] = useState<Date>(
    () => selectedDate ?? new Date(today.getFullYear(), today.getMonth(), 1, 12)
  );
  // Stock con caché compartida entre calendarios, concurrencia acotada
  // y cancelación al navegar rápido (ver lib/use-availability).
  const { stock, loading: loadingMonth } = useMonthAvailability(
    roomTypeId,
    month.getFullYear(),
    month.getMonth()
  );

  // Precarga el mes siguiente en background cuando hay banda libre.
  useEffect(() => {
    if (!roomTypeId) return;
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1, 12);
    prefetchMonth(roomTypeId, next.getFullYear(), next.getMonth());
  }, [roomTypeId, month]);

  const { availableDays, unavailableDays } = useMemo(() => {
    if (!roomTypeId) return { availableDays: [], unavailableDays: [] };
    const avail: Date[] = [];
    const unavail: Date[] = [];
    for (const [iso, count] of Object.entries(stock)) {
      const d = fromIsoDate(iso);
      if (!d || d < min) continue;
      if (count > 0) avail.push(d);
      else unavail.push(d);
    }
    return { availableDays: avail, unavailableDays: unavail };
  }, [stock, roomTypeId, min]);

  return (
    <div id={id}>
      <DayPicker
        mode="single"
        locale={es}
        required
        month={month}
        onMonthChange={setMonth}
        selected={selectedDate}
        onSelect={(d) => {
          if (d) onSelect(toIsoDate(d));
        }}
        disabled={[{ before: min }, ...unavailableDays]}
        modifiers={roomTypeId ? { available: availableDays } : undefined}
        modifiersClassNames={roomTypeId ? { available: "cal-available" } : undefined}
        captionLayout="dropdown"
        startMonth={new Date(today.getFullYear(), today.getMonth(), 1)}
        endMonth={new Date(today.getFullYear() + 1, today.getMonth(), 1)}
      />
      {roomTypeId ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300" aria-live="polite">
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-green-500" />
            Con disponibilidad
          </span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600" />
            Sin disponibilidad
          </span>
          {loadingMonth ? <span>Cargando mes…</span> : null}
        </div>
      ) : null}
    </div>
  );
}
