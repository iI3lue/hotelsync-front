"use client";

import { useState } from "react";
import type { Booking, BookingCreated, RoomType } from "@/lib/api";
import { LONG_TIMEOUT_MS, fetchAvailabilityRange, postJson } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { formatShort } from "@/lib/dates";
import { firstNightWithoutStock, stayNights } from "@/lib/stay-range";
import Money from "@/components/Money";
import { useCurrency } from "@/components/CurrencyProvider";
import RangeCalendar from "@/components/RangeCalendar";
import Spinner from "@/components/Spinner";

/* ─── Helpers ──────────────────────────────────────────────── */
function plusOneDay(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function diffNights(checkInIso: string, checkOutIso: string): number {
  const ms =
    new Date(`${checkOutIso}T12:00:00`).getTime() -
    new Date(`${checkInIso}T12:00:00`).getTime();
  return Math.round(ms / 86400000);
}

/* ─── Step indicator ────────────────────────────────────────── */
interface StepIndicatorProps {
  steps: string[];
  current: number;
}

function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <nav aria-label="Progreso de reserva" className="mb-8">
      <ol className="flex items-center gap-0">
        {steps.map((label, i) => {
          const done   = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 items-center">
              {/* Connector before */}
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 transition-all duration-500 ${
                    done ? "bg-brand-gold" : "bg-gray-200 dark:bg-white/10"
                  }`}
                />
              )}

              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`step-dot ${
                    done    ? "step-dot-done"     :
                    active  ? "step-dot-active"   :
                              "step-dot-inactive"
                  }`}
                >
                  {done ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={`hidden text-[11px] font-medium sm:block ${
                    active ? "text-brand-gold" : done ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connector after */}
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-all duration-500 ${
                    i < current - 1 || done ? "bg-brand-gold" : "bg-gray-200 dark:bg-white/10"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ─── Price breakdown ───────────────────────────────────────── */
function PriceBreakdown({ nights, rate, total }: { nights: number; rate: number; total: number }) {
  const { currency } = useCurrency();
  return (
    <div className="animate-slide-up rounded-2xl border border-brand-gold/20 bg-brand-gold/6 p-5 dark:bg-brand-gold/8">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gold">
        Resumen de precio
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-300">
          <span>Tarifa por noche</span>
          <span className="tabular-nums font-medium"><Money amountCOP={rate} /></span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-300">
          <span>Noches</span>
          <span className="tabular-nums font-medium">× {nights}</span>
        </div>
        <div className="my-2 h-px bg-brand-gold/20" />
        <div className="flex justify-between text-base font-bold text-brand-navy dark:text-white">
          <span>Total</span>
          <span className="tabular-nums text-brand-gold"><Money amountCOP={total} /></span>
        </div>
        {currency !== "COP" && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Monto de referencia en {currency}; el cobro se hace en COP.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Booking confirmation success ──────────────────────────── */
function BookingSuccess({ hotelName, roomTypeName, booking, onCopy, copied }: {
  hotelName: string;
  roomTypeName: string;
  booking: BookingCreated & Partial<Booking>;
  onCopy: (key: string, text: string) => void;
  copied: string | null;
}) {
  const isConfirmed = booking.status === "confirmed";
  const isCancelled = booking.status === "cancelled";

  return (
    <div className="animate-scale-in rounded-2.5xl border border-brand-navy/6 bg-white p-8 shadow-elevated dark:border-white/6 dark:bg-brand-navy-800">
      {/* Status icon */}
      <div className="mb-6 flex justify-center">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
          isConfirmed ? "bg-emerald-100 dark:bg-emerald-950/40" :
          isCancelled ? "bg-red-100 dark:bg-red-950/40" :
                        "bg-amber-100 dark:bg-amber-950/40"
        }`}>
          {isConfirmed ? (
            <svg className="h-8 w-8 animate-check-draw text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : isCancelled ? (
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-8 w-8 text-amber-600 dark:text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="mb-1 text-center text-xl font-semibold text-brand-navy dark:text-white">
        {isConfirmed ? "¡Reserva confirmada!" : isCancelled ? "Reserva cancelada" : "Reserva creada"}
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {isConfirmed
          ? "Tu habitación está asegurada. Presentá el código en recepción."
          : isCancelled
            ? "La reserva se canceló y el inventario se liberó."
            : "Tu lugar está apartado. Confirmá para asegurar la habitación."}
      </p>

      {/* Details */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/6 dark:bg-white/4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Hotel</span>
            <span className="font-medium text-brand-navy dark:text-white">{hotelName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Habitación</span>
            <span className="font-medium text-brand-navy dark:text-white">{roomTypeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Estadía</span>
            <span className="font-medium text-brand-navy dark:text-white">
              {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Total</span>
            <span className="font-bold text-brand-gold"><Money amountCOP={booking.total_amount} /></span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Estado</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isConfirmed ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" :
              isCancelled ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300" :
                            "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isConfirmed ? "bg-emerald-500 animate-pulse" : isCancelled ? "bg-red-500" : "bg-amber-400"}`} />
              {isConfirmed ? "Confirmada" : isCancelled ? "Cancelada" : "Pendiente"}
            </span>
          </div>
        </div>
      </div>

      {/* Codes */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-white/8 dark:bg-white/4">
          <div>
            <p className="text-xs text-gray-400">Código de reserva</p>
            <p className="font-mono text-xs font-semibold text-brand-navy dark:text-white">{booking.booking_id}</p>
          </div>
          <button
            type="button"
            onClick={() => onCopy("booking", booking.booking_id)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/8 dark:text-gray-300 dark:hover:bg-white/6"
          >
            {copied === "booking" ? "¡Copiado!" : "Copiar"}
          </button>
        </div>

        {booking.manage_token && (
          <div className="flex items-center justify-between rounded-xl border border-brand-gold/20 bg-brand-gold/6 p-3 dark:bg-brand-gold/8">
            <div>
              <p className="text-xs text-brand-gold/80">Código de gestión (guardalo)</p>
              <p className="font-mono text-xs font-semibold text-brand-navy dark:text-white">{booking.manage_token}</p>
            </div>
            <button
              type="button"
              onClick={() => onCopy("manage", booking.manage_token!)}
              className="rounded-lg border border-brand-gold/30 px-3 py-1.5 text-xs font-semibold text-brand-gold transition-colors hover:bg-brand-gold/10"
            >
              {copied === "manage" ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
        )}
        <p className="text-center text-xs text-gray-400">
          Guardá el código de gestión para ver o cancelar tu reserva sin cuenta.
        </p>
      </div>

      {/* CTA */}
      <a
        href="/mis-reservas"
        className="btn-primary w-full justify-center"
      >
        Ver mis reservas
      </a>
    </div>
  );
}

/* ─── Main form ─────────────────────────────────────────────── */
interface BookingFormProps {
  hotelId: string;
  hotelName: string;
  roomType: RoomType;
  date: string;
  initialFrom?: string;
  initialTo?: string;
}

const STEPS = ["Fechas", "Datos", "Confirmar"];

export default function BookingForm({
  hotelId,
  hotelName,
  roomType,
  date,
  initialFrom,
  initialTo,
}: BookingFormProps) {
  const [step, setStep] = useState(0);

  // Dates step
  const [checkIn,  setCheckIn]  = useState(initialFrom || date);
  const [checkOut, setCheckOut] = useState(initialTo || (date ? plusOneDay(date) : ""));

  // Guest step
  const [guestName,  setGuestName]  = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // State
  const [booking, setBooking] = useState<(BookingCreated & Partial<Booking>) | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [checking,setChecking]= useState(false);
  const [copied,  setCopied]  = useState<string | null>(null);

  const rate   = Number(roomType.base_rate);
  const nights = checkIn && checkOut ? diffNights(checkIn, checkOut) : 0;
  const total  = nights > 0 ? rate * nights : null;

  /* ── Navigation ── */
  async function goNext() {
    setError(null);
    if (step === 0) {
      if (!checkIn || !checkOut) { setError("Elegí ambas fechas para continuar."); return; }
      if (nights <= 0)           { setError("El check-out debe ser posterior al check-in."); return; }
      // Valida cada noche de la estadía (el rango puede cruzar meses que el
      // calendario aún no cargó). El backend confirma con 409 de todos modos.
      setChecking(true);
      try {
        const lastNight = stayNights(checkIn, checkOut).at(-1) ?? checkIn;
        const range = await fetchAvailabilityRange(roomType.room_type_id, checkIn, lastNight);
        const stock: Record<string, number> = {};
        for (const [iso, a] of Object.entries(range)) stock[iso] = Number(a.available ?? 0);
        const missing = firstNightWithoutStock(stayNights(checkIn, checkOut), stock);
        if (missing) {
          setError(`Sin disponibilidad el ${formatShort(missing)}. Elegí otro rango.`);
          return;
        }
      } catch {
        // Sin stock verificable (red caída, servicio dormido): deja pasar y
        // que el backend decida con su 409.
      } finally {
        setChecking(false);
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() { setError(null); setStep((s) => Math.max(s - 1, 0)); }

  /* ── Create booking ── */
  async function handleCreate() {
    if (!checkIn || !checkOut || total === null) return;
    setError(null);
    setSaving(true);
    try {
      const created = await postJson<BookingCreated>("/api/booking/bookings", {
        hotel_id: hotelId,
        room_type_id: roomType.room_type_id,
        check_in: checkIn,
        check_out: checkOut,
        channel: "direct",
        total_amount: total,
        guest: { name: guestName.trim(), email: guestEmail.trim(), phone: guestPhone.trim() },
      },
      {},
      // Sin reintento (POST no idempotente) pero con timeout largo: el
      // booking dormido en free tier tarda en despertar.
      { timeoutMs: LONG_TIMEOUT_MS });
      setBooking(created);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear la reserva";
      const conflict     = msg.includes("409") || msg.toLowerCase().includes("conflict");
      const unavailable  = msg.toLowerCase().includes("available") || msg.toLowerCase().includes("disponib") || msg.toLowerCase().includes("inventory");
      setError(
        conflict    ? "Otra reserva tomó esta habitación. Cambiá las fechas o el tipo de habitación." :
        unavailable ? "No hay habitaciones disponibles para esas fechas." :
                      `${msg}. Revisá los datos e intentá de nuevo.`
      );
    } finally {
      setSaving(false);
    }
  }

  /* ── Confirm / Cancel ── */
  async function handleTransition(action: "confirm" | "cancel") {
    if (!booking) return;
    setError(null);
    setSaving(true);
    try {
      const headers: Record<string, string> = booking.manage_token
        ? { "x-manage-token": booking.manage_token }
        : {};
      const updated = await postJson<Booking>(
        `/api/booking/bookings/${booking.booking_id}/${action}`,
        {},
        headers
      );
      setBooking({ ...updated, manage_token: booking.manage_token });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar la reserva";
      const conflict = msg.includes("409") || msg.toLowerCase().includes("conflict");
      setError(
        conflict
          ? "La reserva cambió desde otro lado. Recargá la página."
          : `${msg}. Intentá de nuevo.`
      );
    } finally {
      setSaving(false);
    }
  }

  /* ── Copy ── */
  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((p) => (p === key ? null : p)), 2000);
    } catch { /* noop */ }
  }

  /* ── If we got a completed booking (created), show status page ── */
  if (booking) {
    return (
      <div>
        <BookingSuccess
          hotelName={hotelName}
          roomTypeName={roomType.name}
          booking={booking}
          onCopy={(k, t) => void copyText(k, t)}
          copied={copied}
        />

        {/* Pending actions */}
        {booking.status === "pending" && (
          <div className="animate-slide-up mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleTransition("confirm")}
              disabled={saving}
              className="btn-primary flex-1 justify-center"
            >
              {saving ? <Spinner label="Procesando…" /> : "Confirmar reserva"}
            </button>
            <button
              type="button"
              onClick={() => void handleTransition("cancel")}
              disabled={saving}
              className="btn-danger flex-1 justify-center"
            >
              {saving ? <Spinner label="Procesando…" /> : "Cancelar"}
            </button>
          </div>
        )}

        {/* Errors post-booking */}
        {error && (
          <div aria-live="polite" className="mt-4">
            <p role="alert" className="animate-notice-in flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-300">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2.5xl border border-brand-navy/6 bg-white p-6 shadow-card dark:border-white/6 dark:bg-brand-navy-800 md:p-8">
      {/* Step indicator */}
      <StepIndicator steps={STEPS} current={step} />

      {/* ── Step 0: Dates ── */}
      {step === 0 && (
        <div className="animate-slide-up space-y-6">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-brand-navy dark:text-white">Elegí tus fechas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tocá la llegada y después la salida. Los días en verde tienen habitaciones disponibles.
            </p>
          </div>

          <fieldset className="min-w-0">
            <legend className="input-label mb-2">Estadía</legend>
            <RangeCalendar
              roomTypeId={roomType.room_type_id}
              from={checkIn || undefined}
              to={checkOut || undefined}
              onChange={(from, to) => {
                setCheckIn(from);
                setCheckOut(to);
              }}
            />
          </fieldset>

          {checking && (
            <p aria-live="polite" className="text-sm text-gray-500 dark:text-gray-400">
              Verificando disponibilidad de cada noche…
            </p>
          )}

          {/* Live price preview */}
          {checkIn && checkOut && total !== null && (
            <PriceBreakdown nights={nights} rate={rate} total={total} />
          )}
        </div>
      )}

      {/* ── Step 1: Guest data ── */}
      {step === 1 && (
        <div className="animate-slide-up space-y-6">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-brand-navy dark:text-white">Datos del huésped</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              El hotel te identifica con estos datos.
            </p>
          </div>

          <fieldset className="space-y-4">
            <legend className="sr-only">Datos del huésped</legend>

            <div>
              <label htmlFor="booking-guest-name" className="input-label">Nombre completo</label>
              <input
                id="booking-guest-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                autoComplete="name"
                placeholder="Juan García"
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="booking-guest-email" className="input-label">Correo electrónico</label>
              <input
                id="booking-guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                autoComplete="email"
                placeholder="vos@ejemplo.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="booking-guest-phone" className="input-label">Teléfono</label>
              <input
                id="booking-guest-phone"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+54 11 1234-5678"
                className="input-field"
                required
              />
            </div>
          </fieldset>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Sin cuenta: el hotel te identifica con estos datos y un código de gestión.
          </p>
        </div>
      )}

      {/* ── Step 2: Review & confirm ── */}
      {step === 2 && (
        <div className="animate-slide-up space-y-6">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-brand-navy dark:text-white">Revisá tu reserva</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Verificá los datos antes de confirmar.
            </p>
          </div>

          {/* Summary card */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-white/6 dark:bg-white/4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Hotel</span>
                <span className="font-semibold text-brand-navy dark:text-white">{hotelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Habitación</span>
                <span className="font-medium text-brand-navy dark:text-white">{roomType.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Check-in</span>
                <span className="font-medium text-brand-navy dark:text-white">{formatDate(checkIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Check-out</span>
                <span className="font-medium text-brand-navy dark:text-white">{formatDate(checkOut)}</span>
              </div>
              <div className="h-px bg-gray-200 dark:bg-white/8" />
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Huésped</span>
                <span className="font-medium text-brand-navy dark:text-white">{guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Correo</span>
                <span className="font-medium text-brand-navy dark:text-white">{guestEmail}</span>
              </div>
            </div>
          </div>

          {/* Price */}
          {total !== null && <PriceBreakdown nights={nights} rate={rate} total={total} />}

          {/* Payment note */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Pago en recepción</p>
              <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
                El pago se realiza al hacer check-in. Tu reserva queda asegurada con este formulario.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div aria-live="polite" className="mt-4">
          <p role="alert" className="animate-notice-in flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-300">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={goBack} className="btn-ghost" disabled={saving}>
            ← Atrás
          </button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => void goNext()}
            disabled={checking}
            className="btn-primary"
          >
            {checking ? "Verificando…" : "Siguiente →"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving || !guestName.trim() || !guestEmail.trim() || !guestPhone.trim()}
            className="btn-primary"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creando reserva…
              </span>
            ) : "Crear reserva"}
          </button>
        )}
      </div>
    </div>
  );
}
