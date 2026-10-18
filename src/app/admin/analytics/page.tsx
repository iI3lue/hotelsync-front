"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ApiError,
  fetchAnalyticsDashboard,
  fetchAnalyticsOccupancy,
  fetchHotels,
  type AnalyticsDashboard,
  type AnalyticsOccupancyPoint,
} from "@/lib/api-client";
import type { Hotel } from "@/lib/api";
import { toIsoDate } from "@/lib/dates";
import { formatDate, formatMoney } from "@/lib/format";

function isoDaysFromToday(offset: number): string {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  return toIsoDate(day);
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const cardClass =
  "rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-brand-navy-800";
const labelClass =
  "text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";
const valueClass =
  "mt-3 font-display text-3xl font-bold tabular-nums text-brand-navy dark:text-white";
const fieldClass =
  "h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold dark:border-white/10 dark:bg-brand-navy-800 dark:text-white";

export default function AnalyticsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [from, setFrom] = useState(() => isoDaysFromToday(-30));
  const [to, setTo] = useState(() => isoDaysFromToday(1));
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [occupancy, setOccupancy] = useState<AnalyticsOccupancyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetchHotels()
      .then((list) => {
        if (cancelled) return;
        setHotels(list);
        setHotelId((current) => current || list[0]?.hotel_id || "");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "No se pudieron cargar los hoteles."
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    if (!hotelId || !from || !to) return;
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const range = { from, to };
      const [nextDashboard, nextOccupancy] = await Promise.all([
        fetchAnalyticsDashboard(hotelId, range),
        fetchAnalyticsOccupancy(hotelId, range),
      ]);
      if (requestRef.current !== request) return;
      setDashboard(nextDashboard);
      setOccupancy(nextOccupancy);
    } catch (err: unknown) {
      if (requestRef.current !== request) return;
      setDashboard(null);
      setOccupancy([]);
      setError(
        err instanceof ApiError ? err.message : "No se pudieron cargar las métricas."
      );
    } finally {
      if (requestRef.current === request) setLoading(false);
    }
  }, [hotelId, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxOccupancy = useMemo(
    () => occupancy.reduce((max, point) => Math.max(max, point.occupancy), 0),
    [occupancy]
  );

  const selectedHotel = hotels.find((hotel) => hotel.hotel_id === hotelId);
  const invalidRange = Boolean(from && to && from >= to);
  const isEmpty = !loading && !error && !invalidRange && occupancy.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-brand-navy dark:text-white sm:text-3xl">
              Revenue Management
            </h1>
            <span className="rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-xs font-semibold text-brand-gold">
              Ocupación · ADR · RevPAR
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Agregados diarios calculados por el ETL sobre réplicas de solo lectura.
            {selectedHotel ? ` Hotel: ${selectedHotel.name}.` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Hotel
            <select
              className={`${fieldClass} min-w-[14rem]`}
              value={hotelId}
              onChange={(event) => setHotelId(event.target.value)}
              aria-label="Hotel"
            >
              {hotels.length === 0 && <option value="">Sin hoteles</option>}
              {hotels.map((hotel) => (
                <option key={hotel.hotel_id} value={hotel.hotel_id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Desde
            <input
              type="date"
              className={fieldClass}
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Hasta (exclusivo)
            <input
              type="date"
              className={fieldClass}
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
        </div>
      </div>

      {invalidRange && (
        <p
          role="alert"
          className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
        >
          La fecha &quot;Hasta&quot; debe ser posterior a &quot;Desde&quot; (es exclusiva,
          como el check-out: cubre las noches hasta un día antes).
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200"
        >
          {error}
        </p>
      )}

      {loading && (
        <p role="status" className="text-sm text-gray-500 dark:text-gray-400">
          Cargando métricas…
        </p>
      )}

      {!loading && !error && !invalidRange && dashboard && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className={cardClass}>
              <span className={labelClass}>Ocupación media</span>
              <p className={valueClass} role="status">
                {percent(dashboard.occupancy_avg)}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Promedio del rango consultado
              </p>
            </div>
            <div className={cardClass}>
              <span className={labelClass}>ADR promedio</span>
              <p className={valueClass} role="status">
                {formatMoney(dashboard.adr_avg, "COP")}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Tarifa media diaria por habitación vendida
              </p>
            </div>
            <div className={cardClass}>
              <span className={labelClass}>RevPAR promedio</span>
              <p className={valueClass} role="status">
                {formatMoney(dashboard.revpar_avg, "COP")}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Ingreso por habitación disponible
              </p>
            </div>
          </div>

          <section className={`${cardClass} space-y-4`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-brand-navy dark:text-white">
                Ocupación diaria
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {occupancy.length === 1
                  ? "1 día con datos"
                  : `${occupancy.length} días con datos`}
              </span>
            </div>

            {occupancy.length > 0 ? (
              <>
                <ul className="flex h-40 items-end gap-1" aria-label="Ocupación diaria">
                  {occupancy.map((point) => (
                    <li
                      key={point.date}
                      className="flex h-full min-w-[6px] max-w-10 flex-1 flex-col justify-end"
                      title={`${formatDate(point.date)}: ${percent(point.occupancy)} (${point.occupied_nights}/${point.available_nights})`}
                    >
                      <div
                        aria-hidden="true"
                        className="w-full rounded-t bg-brand-gold/70 dark:bg-brand-gold/80"
                        style={{
                          height: `${
                            maxOccupancy > 0
                              ? Math.max((point.occupancy / maxOccupancy) * 100, 1)
                              : 0
                          }%`,
                        }}
                      />
                      <span className="sr-only">
                        {`${formatDate(point.date)}: ${percent(point.occupancy)}`}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{occupancy[0] ? formatDate(occupancy[0].date) : ""}</span>
                  <span>{occupancy.length > 0 ? formatDate(occupancy[occupancy.length - 1].date) : ""}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sin noches con datos en el rango.
              </p>
            )}
          </section>

          <section className={`${cardClass} space-y-4`}>
            <h2 className="font-display text-lg font-bold text-brand-navy dark:text-white">
              Previsión (14 días)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th scope="col" className="pb-2 pr-4 font-semibold">
                      Fecha
                    </th>
                    <th scope="col" className="pb-2 pr-4 font-semibold">
                      Ocupación esperada
                    </th>
                    <th scope="col" className="pb-2 pr-4 font-semibold">
                      ADR esperado
                    </th>
                    <th scope="col" className="pb-2 font-semibold">
                      RevPAR esperado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/6">
                  {dashboard.forecast.map((point) => (
                    <tr key={point.date} className="text-gray-700 dark:text-gray-200">
                      <td className="py-2 pr-4 tabular-nums">{formatDate(point.date)}</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {percent(point.occupancy_expected)}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">
                        {formatMoney(point.adr_expected, "COP")}
                      </td>
                      <td className="py-2 tabular-nums">
                        {formatMoney(point.revpar_expected, "COP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Media móvil de la historia disponible; es una referencia, no una predicción
              con temporada.
            </p>
          </section>
        </>
      )}

      {isEmpty && (
        <div className={`${cardClass} space-y-2`}>
          <h2 className="font-display text-lg font-bold text-brand-navy dark:text-white">
            Sin datos para este hotel y rango
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            El ETL todavía no agregó noches de este hotel. Corré una corrida manual y
            volvé a consultar:
          </p>
          <code className="block overflow-x-auto rounded-xl bg-gray-50 p-3 text-xs text-gray-800 dark:bg-brand-navy-900 dark:text-gray-200">
            npm run etl --workspace=services/analytics-service -- --from={from} --to={to}
          </code>
        </div>
      )}
    </div>
  );
}
