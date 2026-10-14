"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { es } from "react-day-picker/locale";
import { fromIsoDate, toIsoDate } from "@/lib/dates";
import { prefetchMonth, useMonthAvailability } from "@/lib/use-availability";

interface RangeCalendarProps {
  /** Si se pasa, cada día muestra su stock y los días sin stock se deshabilitan. */
  roomTypeId?: string;
  /** Extremos del rango en formato YYYY-MM-DD. */
  from?: string;
  to?: string;
  onChange: (from: string, to: string) => void;
  /** Fecha mínima elegible en formato YYYY-MM-DD (por defecto hoy). */
  minDate?: string;
  id?: string;
}

/**
 * Selector de rango de estadía: un clic fija la llegada, el segundo la
 * salida (en táctil, dos toques; no hay hover). Los días sin stock quedan
 * excluidos del rango (`excludeDisabled` reinicia si se tocan).
 */
export default function RangeCalendar({
  roomTypeId,
  from,
  to,
  onChange,
  minDate,
  id,
}: RangeCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const min = minDate ? (fromIsoDate(minDate) ?? today) : today;

  const range: DateRange | undefined = useMemo(() => {
    const f = from ? fromIsoDate(from) : undefined;
    const t = to ? fromIsoDate(to) : undefined;
    if (!f && !t) return undefined;
    return { from: f, to: t };
  }, [from, to]);

  const [month, setMonth] = useState<Date>(
    () => range?.from ?? new Date(today.getFullYear(), today.getMonth(), 1, 12)
  );
  const { stock, loading: loadingMonth } = useMonthAvailability(
    roomTypeId,
    month.getFullYear(),
    month.getMonth()
  );

  // Autoselect check-in: si hay roomTypeId y ya cargó la disponibilidad y no
  // hay rango elegido aún, pre-seleccionar el primer día disponible como from.
  useEffect(() => {
    if (!roomTypeId || from || loadingMonth) return;
    const entries = Object.entries(stock).sort(([a], [b]) => (a < b ? -1 : 1));
    for (const [iso, count] of entries) {
      const d = fromIsoDate(iso);
      if (!d || d < min) continue;
      if (count > 0) {
        onChange(iso, "");
        break;
      }
    }
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

  function handleSelect(next: DateRange | undefined) {
    if (!next?.from) {
      onChange("", "");
      return;
    }
    const nextFrom = toIsoDate(next.from);
    const nextTo = next.to ? toIsoDate(next.to) : to && to > nextFrom ? to : "";
    onChange(nextFrom, nextTo);
  }

  return (
    <div id={id} className="flex flex-col items-center">
      <DayPicker
        mode="range"
        locale={es}
        min={1}
        excludeDisabled
        month={month}
        onMonthChange={setMonth}
        selected={range}
        onSelect={handleSelect}
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
