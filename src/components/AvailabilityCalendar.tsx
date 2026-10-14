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
  const { stock, loading: loadingMonth } = useMonthAvailability(
    roomTypeId,
    month.getFullYear(),
    month.getMonth()
  );

  // Autoselect: si hay roomTypeId y la disponibilidad ya cargó y no hay fecha
  // seleccionada, elegir automáticamente el primer día disponible del mes actual.
  useEffect(() => {
    if (!roomTypeId || selected || loadingMonth) return;
    const entries = Object.entries(stock).sort(([a], [b]) => (a < b ? -1 : 1));
    for (const [iso, count] of entries) {
      const d = fromIsoDate(iso);
      if (!d || d < min) continue;
      if (count > 0) {
        onSelect(iso);
        break;
      }
    }
    // Only run when stock or roomTypeId changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stock, roomTypeId]);

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
    <div id={id} className="flex flex-col items-center">
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
        classNames={{
          root: "rdp-root rdp-custom",
        }}
      />
      {roomTypeId ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300" aria-live="polite">
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-[#2F6B4F]" />
            Con disponibilidad
          </span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600" />
            Sin disponibilidad
          </span>
          {loadingMonth ? (
            <span className="inline-flex items-center gap-1 text-gray-400">
              <span className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
              Cargando…
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
