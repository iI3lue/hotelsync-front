"use client";

import { useEffect, useRef, useState } from "react";
import { fetchAvailabilityRange } from "./api-client";

/** Caché compartida entre todos los calendarios de la página. */
const sharedCache = new Map<string, number>();
/** Deduplica fetches concurrentes del mismo mes. */
const inflightMonths = new Map<string, Promise<Record<string, number>>>();

export function toMonthDays(year: number, monthIndex: number): string[] {
  const days: string[] = [];
  const d = new Date(year, monthIndex, 1, 12);
  while (d.getMonth() === monthIndex) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${d.getFullYear()}-${m}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function monthKey(roomTypeId: string, year: number, monthIndex: number): string {
  return `${roomTypeId}:${year}-${monthIndex}`;
}

function stockFromCache(
  roomTypeId: string,
  days: string[]
): Record<string, number> | null {
  const next: Record<string, number> = {};
  for (const iso of days) {
    const hit = sharedCache.get(`${roomTypeId}:${iso}`);
    if (hit === undefined) return null;
    next[iso] = hit;
  }
  return next;
}

/**
 * Mes entero en UN solo request al endpoint de rango. Los días ya cacheados
 * se sirven al instante; si falta alguno se trae el mes completo (superset
 * idempotente) y se guarda día por día en la caché compartida.
 */
function fetchMonth(
  roomTypeId: string,
  year: number,
  monthIndex: number
): Promise<Record<string, number>> {
  const days = toMonthDays(year, monthIndex);
  const cached = stockFromCache(roomTypeId, days);
  if (cached) return Promise.resolve(cached);

  const key = monthKey(roomTypeId, year, monthIndex);
  const ongoing = inflightMonths.get(key);
  if (ongoing) return ongoing;

  const p = fetchAvailabilityRange(roomTypeId, days[0], days[days.length - 1])
    .then((range) => {
      const next: Record<string, number> = {};
      for (const iso of days) {
        const n = Number(range[iso]?.available ?? 0);
        sharedCache.set(`${roomTypeId}:${iso}`, n);
        next[iso] = n;
      }
      return next;
    })
    .finally(() => {
      inflightMonths.delete(key);
    });
  inflightMonths.set(key, p);
  return p;
}

/** Precarga un mes en background (los meses ya cacheados se saltean). */
export function prefetchMonth(
  roomTypeId: string,
  year: number,
  monthIndex: number
): void {
  const run = () => {
    fetchMonth(roomTypeId, year, monthIndex).catch(() => undefined);
  };
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(run);
  } else {
    setTimeout(run, 0);
  }
}

/**
 * Stock del mes para pintar el calendario: un solo request por mes,
 * caché compartida entre calendarios y cancelación al navegar rápido.
 */
export function useMonthAvailability(
  roomTypeId: string | undefined,
  year: number,
  monthIndex: number
): { stock: Record<string, number>; loading: boolean } {
  const [stock, setStock] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    if (!roomTypeId) {
      setStock({});
      setLoading(false);
      return;
    }
    const my = ++seq.current;
    let cancelled = false;
    const days = toMonthDays(year, monthIndex);

    // Pinta al instante lo cacheado (incluye lo del otro calendario).
    const cached = stockFromCache(roomTypeId, days);
    if (my === seq.current) setStock(cached ?? {});
    if (cached) {
      setLoading(false);
      return;
    }
    setLoading(true);

    fetchMonth(roomTypeId, year, monthIndex)
      .then((next) => {
        if (!cancelled && my === seq.current) {
          setStock(next);
          setLoading(false);
        }
      })
      .catch(() => {
        // El mes queda sin pintar; se reintenta al volver a él.
        if (!cancelled && my === seq.current) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomTypeId, year, monthIndex]);

  return { stock, loading };
}
