"use client";

import { useCallback, useEffect, useState } from "react";
import type { BookingRef, PhysicalRoom } from "@/lib/api";
import { fetchPaymentStatusForStaff, fetchPhysicalRooms, postJson } from "@/lib/api-client";
import PaymentBadge from "@/components/payments/PaymentBadge";
import RegisterPaymentModal from "@/components/payments/RegisterPaymentModal";
import { timeoutSignal } from "@/lib/timeout-signal";
import { useRoomNames } from "@/lib/use-room-names";
import { formatDate } from "@/lib/format";

interface ReceptionBoardProps {
  hotelId: string;
  date: string;
}

const inputClass =
  "rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 touch-manipulation dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";

export default function ReceptionBoard({ hotelId, date }: ReceptionBoardProps) {
  const [arrivals, setArrivals] = useState<BookingRef[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<PhysicalRoom[]>([]);
  const roomNames = useRoomNames(hotelId);
  // Estado de cobro por reserva. payment-service es la fuente de verdad:
  // booking-service puede tardar unos segundos en procesar el evento.
  const [paid, setPaid] = useState<Record<string, "PAID" | "PENDING">>({});
  const [paying, setPaying] = useState<BookingRef | null>(null);
  const [checkoutWarned, setCheckoutWarned] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/front-desk/arrivals?hotel_id=${encodeURIComponent(hotelId)}&date=${encodeURIComponent(date)}`,
          { signal: timeoutSignal(10000) }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Error ${res.status}`);
        }
        const list: BookingRef[] = await res.json();
        setArrivals(list);
        setPaid(Object.fromEntries(list.map((b) => [b.booking_id, b.payment_status === "PAID" ? "PAID" : "PENDING"])));
        // Refina solo las que figuran pendientes (pueden haberse pagado en línea).
        void Promise.allSettled(
          list
            .filter((b) => b.payment_status !== "PAID")
            .map((b) => fetchPaymentStatusForStaff(b.booking_id))
        ).then((results) => {
          const updates: Record<string, "PAID" | "PENDING"> = {};
          for (const r of results) if (r.status === "fulfilled") updates[r.value.booking_id] = r.value.payment_status;
          if (Object.keys(updates).length) setPaid((prev) => ({ ...prev, ...updates }));
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar las llegadas");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [hotelId, date]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetchPhysicalRooms(hotelId)
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, [hotelId]);

  const handleCheckIn = async (bookingId: string) => {
    const room = (rooms[bookingId] || "").trim();
    if (!room) {
      setError("Ingresá el número de habitación física para el check-in");
      return;
    }
    setBusy(bookingId);
    setError(null);
    try {
      await postJson("/api/front-desk/check-in", {
        booking_id: bookingId,
        physical_room_number: room,
      });
      // Optimista: el aviso sale al instante; la lista se revalida en fondo.
      setNotice(`Check-in OK: reserva ${bookingId.slice(0, 8)}… en habitación ${room}`);
      setBusy(null);
      void load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo hacer el check-in");
      setBusy(null);
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    // Saldo pendiente: primer clic avisa, segundo confirma el check-out.
    if (paid[bookingId] !== "PAID" && checkoutWarned !== bookingId) {
      setCheckoutWarned(bookingId);
      setNotice(null);
      setError("Esta reserva tiene saldo pendiente. Registrá el pago o presioná Check-out otra vez para continuar igual.");
      return;
    }
    setCheckoutWarned(null);
    setBusy(bookingId);
    setError(null);
    try {
      await postJson("/api/front-desk/check-out", { booking_id: bookingId });
      // Optimista: el aviso sale al instante; la lista se revalida en fondo.
      setNotice(`Check-out OK: reserva ${bookingId.slice(0, 8)}… (checkout.completed emitido)`);
      setBusy(null);
      void load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo hacer el check-out");
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-brand-navy-800">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
        <p role="status" className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Cargando llegadas del día…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div aria-live="polite">
        {error ? (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 backdrop-blur-sm dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-medium">{error}</p>
          </div>
        ) : null}
        {notice ? (
          <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 backdrop-blur-sm dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
            <svg className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">{notice}</p>
          </div>
        ) : null}
      </div>

      {!arrivals || arrivals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white/60 p-12 text-center backdrop-blur-sm dark:border-white/10 dark:bg-brand-navy-800/40">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/15 text-brand-gold">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-semibold text-brand-navy dark:text-white">
            Sin llegadas confirmadas para esta fecha
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Front Desk solo muestra reservas confirmadas. Si creaste una reserva recién,
            revisá la pestaña <strong>Reservas (auto)</strong> para confirmar o seguir su estado.
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-xs transition-all hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-brand-navy-900 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reintentar consulta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p role="status" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {arrivals.length === 1 ? "1 llegada lista para recepción" : `${arrivals.length} llegadas listas para recepción`}
            </p>
            <button
              type="button"
              onClick={() => void load(true)}
              title="Refrescar lista"
              className="text-xs font-medium text-brand-gold hover:underline"
            >
              Actualizar lista
            </button>
          </div>

          <ul className="space-y-3">
            {arrivals.map((b) => (
              <li
                key={b.booking_id}
                className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-all hover:border-brand-gold/40 hover:shadow-card dark:border-white/10 dark:bg-brand-navy-800"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[1.15rem] text-brand-navy dark:text-white">
                        {b.guest_name || "Huésped sin registrar"}
                      </span>
                      <span className="rounded-full border border-brand-navy/15 px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-brand-navy/70 dark:border-white/20 dark:text-white/70">
                        {b.status === "confirmed" ? "Confirmada" : b.status === "pending" ? "Pendiente" : b.status}
                      </span>
                      <PaymentBadge size="sm" status={paid[b.booking_id] ?? b.payment_status} preference={b.payment_method_preference} />
                      <span className="font-mono text-xs text-gray-400">
                        ID: {b.booking_id.slice(0, 8)}…
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1.5 font-medium text-brand-navy dark:text-brand-gold">
                        <svg className="h-4 w-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {roomNames[b.room_type_id] ?? "Habitación estándar"}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="tabular-nums">
                        {formatDate(b.check_in)} → {formatDate(b.check_out)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                    <div className="relative">
                      <label htmlFor={`room-${b.booking_id}`} className="sr-only">
                        Habitación física
                      </label>
                      <input
                        id={`room-${b.booking_id}`}
                        type="text"
                        placeholder="Nº habitación (ej. 101)"
                        value={rooms[b.booking_id] || ""}
                        onChange={(e) =>
                          setRooms((prev) => ({ ...prev, [b.booking_id]: e.target.value }))
                        }
                        list={`catalog-${b.booking_id}`}
                        autoComplete="off"
                        className="h-10 w-44 rounded-xl border border-gray-300 bg-gray-50/50 px-3 text-sm font-medium text-gray-900 transition-colors focus:border-brand-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:border-white/10 dark:bg-brand-navy-900 dark:text-white"
                      />
                      <datalist id={`catalog-${b.booking_id}`}>
                        {catalog.map((r) => (
                          <option key={r.physical_room_id} value={r.room_number}>
                            {r.roomType.name}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckIn(b.booking_id)}
                      disabled={busy === b.booking_id}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-navy px-4 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-navy-900 hover:shadow active:scale-95 disabled:opacity-50 dark:bg-brand-gold dark:text-brand-navy dark:hover:bg-brand-gold-dark"
                    >
                      {busy === b.booking_id ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Procesando…
                        </>
                      ) : (
                        "Check-in"
                      )}
                    </button>

                    {paid[b.booking_id] !== "PAID" && (
                      <button
                        type="button"
                        onClick={() => setPaying(b)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-500/60 bg-amber-50 px-3.5 text-sm font-semibold text-amber-900 transition-all hover:bg-amber-100 active:scale-95 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-100"
                      >
                        Registrar pago
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCheckOut(b.booking_id)}
                      disabled={busy === b.booking_id}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 px-3.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      Check-out
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {paying && (
        <RegisterPaymentModal
          booking={paying}
          onClose={() => setPaying(null)}
          onPaid={(tx) => {
            setPaid((prev) => ({ ...prev, [tx.booking_id]: "PAID" }));
            setPaying(null);
            setError(null);
            setCheckoutWarned(null);
            setNotice(`Pago registrado: reserva ${tx.booking_id.slice(0, 8)}… (${tx.method === "CREDIT_CARD" ? "pagada en línea" : "cobrada en recepción"})`);
          }}
        />
      )}
    </div>
  );
}
