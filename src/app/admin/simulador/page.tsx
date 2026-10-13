"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Hotel, RoomType } from "@/lib/api";
import { fetchHotels, fetchRoomTypes } from "@/lib/api-client";

const inputClass =
  "rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 touch-manipulation dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200";

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange(): { checkIn: string; checkOut: string } {
  const inDate = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const outDate = new Date(Date.now() + 32 * 24 * 3600 * 1000);
  return { checkIn: toIso(inDate), checkOut: toIso(outDate) };
}

interface SimResult {
  external_id: string;
  booking_id: string;
  status: string;
  manage_token?: string;
  created?: boolean;
}

export default function SimulatorPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [range, setRange] = useState(defaultRange);
  const [guestName, setGuestName] = useState("Prueba OTA");
  const [guestEmail, setGuestEmail] = useState("ota-test@hotelsync.local");
  const [guestPhone, setGuestPhone] = useState("+573001234567");
  const [total, setTotal] = useState("17000");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimResult | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    void fetchHotels()      .then((data) => {
        setHotels(data);
        if (data.length > 0) setHotelId(data[0].hotel_id);
      })
      .catch(() => setHotels([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!hotelId) {
      setRoomTypes([]);
      setRoomTypeId("");
      return;
    }
    void fetchRoomTypes(hotelId)
      .then((data) => {
        setRoomTypes(data);
        setRoomTypeId(data[0]?.room_type_id ?? "");
      })
      .catch(() => {
        setRoomTypes([]);
        setRoomTypeId("");
      });
  }, [hotelId]);

  const submit = useCallback(
    async (externalId?: string) => {
      setBusy(true);
      setElapsed(0);
      setError(null);
      const startedAt = Date.now();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - startedAt) / 1000));
      }, 500);
      try {
        const res = await fetch("/api/simulator/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(externalId ? { external_id: externalId } : {}),
            hotel_id: hotelId,
            room_type_id: roomTypeId,
            check_in: range.checkIn,
            check_out: range.checkOut,
            total_amount: Number(total),
            guest: {
              name: guestName.trim(),
              email: guestEmail.trim(),
              phone: guestPhone.trim(),
            },
          }),
        });
        const data = (await res.json().catch(() => ({}))) as SimResult & {
          error?: string;
          message?: string;
        };
        if (!res.ok) {
          throw new Error(data.message || data.error || `Error ${res.status}`);
        }
        setResult(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo simular la reserva"
        );
      } finally {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setBusy(false);
      }
    },
    [hotelId, roomTypeId, range, guestName, guestEmail, guestPhone, total]
  );

  const ready = hotelId !== "" && roomTypeId !== "";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Simulador OTA</h1>
      <p className="mb-6 max-w-2xl break-words text-gray-600 dark:text-gray-300">
        Ingesta de prueba por el canal <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">simulado</code> del
        Channel Manager. Solo SUPER_ADMIN. La reserva entra a Booking como{" "}
        <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">ota:simulado</code> y
        descuenta inventario real: usá fechas futuras de prueba.
      </p>

      {error ? (
        <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {result ? (
        <div role="status" className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {result.created === false ? "Reingesta idempotente (mismo ID)" : "Reserva creada"}
          </p>
          <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div><dt className="font-medium">external_id</dt><dd className="font-mono">{result.external_id}</dd></div>
            <div><dt className="font-medium">booking_id</dt><dd className="font-mono break-all">{result.booking_id}</dd></div>
            <div><dt className="font-medium">estado</dt><dd>{result.status}</dd></div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit(result.external_id)}
              className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 touch-manipulation"
            >
              Reintentar (idempotencia)
            </button>
            <a
              href={`/admin/recepcion?hotel_id=${hotelId}`}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 touch-manipulation"
            >
              Ver en Recepción
            </a>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p role="status" className="text-gray-500 dark:text-gray-400">Cargando hoteles…</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="rounded-lg bg-white p-4 shadow dark:bg-gray-800"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sim-hotel" className={labelClass}>Hotel</label>
              <select
                id="sim-hotel"
                value={hotelId}
                onChange={(e) => setHotelId(e.target.value)}
                className={`${inputClass} w-full`}
                required
              >
                {hotels.map((h) => (
                  <option key={h.hotel_id} value={h.hotel_id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sim-room-type" className={labelClass}>Tipo de habitación</label>
              <select
                id="sim-room-type"
                value={roomTypeId}
                onChange={(e) => setRoomTypeId(e.target.value)}
                className={`${inputClass} w-full`}
                required
              >
                {roomTypes.map((r) => (
                  <option key={r.room_type_id} value={r.room_type_id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sim-checkin" className={labelClass}>Check-in</label>
              <input
                id="sim-checkin"
                type="date"
                value={range.checkIn}
                onChange={(e) => setRange((p) => ({ ...p, checkIn: e.target.value }))}
                className={`${inputClass} w-full`}
                required
              />
            </div>
            <div>
              <label htmlFor="sim-checkout" className={labelClass}>Check-out</label>
              <input
                id="sim-checkout"
                type="date"
                value={range.checkOut}
                min={range.checkIn}
                onChange={(e) => setRange((p) => ({ ...p, checkOut: e.target.value }))}
                className={`${inputClass} w-full`}
                required
              />
            </div>
            <div>
              <label htmlFor="sim-name" className={labelClass}>Huésped</label>
              <input
                id="sim-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className={`${inputClass} w-full`}
                required
              />
            </div>
            <div>
              <label htmlFor="sim-email" className={labelClass}>Email</label>
              <input
                id="sim-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className={`${inputClass} w-full`}
                required
              />
            </div>
            <div>
              <label htmlFor="sim-phone" className={labelClass}>Teléfono</label>
              <input
                id="sim-phone"
                type="text"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className={`${inputClass} w-full`}
                required
              />
            </div>
            <div>
              <label htmlFor="sim-total" className={labelClass}>Total</label>
              <input
                id="sim-total"
                type="number"
                min={0}
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className={`${inputClass} w-full`}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy || !ready}
            className="mt-4 inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 touch-manipulation"
          >
            {busy ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Simulando… {elapsed}s
              </>
            ) : (
              "Simular reserva OTA"
            )}
          </button>
          {busy && elapsed >= 10 ? (
            <p role="status" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Los servicios en plan free despiertan lento; puede tardar hasta ~1 min. No cierres la página.
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
