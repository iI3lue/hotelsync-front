"use client";

import { useState } from "react";
import type { Booking, BookingCreated, RoomType } from "@/lib/api";
import { postJson } from "@/lib/api-client";
import { formatDate, formatPrice } from "@/lib/format";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import Spinner from "@/components/Spinner";

interface BookingFormProps {
  hotelId: string;
  hotelName: string;
  roomType: RoomType;
  date: string;
  /** Fechas heredadas de la búsqueda (tienen prioridad sobre `date`). */
  initialFrom?: string;
  initialTo?: string;
}

const labelClass =
  "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200";

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

export default function BookingForm({
  hotelId,
  hotelName,
  roomType,
  date,
  initialFrom,
  initialTo,
}: BookingFormProps) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkIn, setCheckIn] = useState(initialFrom || date);
  const [checkOut, setCheckOut] = useState(
    initialTo || (date ? plusOneDay(date) : "")
  );
  const [booking, setBooking] = useState<BookingCreated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const rate = Number(roomType.base_rate);
  const nights =
    checkIn && checkOut ? diffNights(checkIn, checkOut) : 0;
  const total = nights > 0 ? rate * nights : null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!checkIn || !checkOut) {
      setError("Elegí las fechas de check-in y check-out en el calendario");
      return;
    }
    if (total === null) {
      setError("El check-out tiene que ser posterior al check-in");
      return;
    }
    setSaving(true);
    try {
      const created = await postJson<BookingCreated>("/api/booking/bookings", {
        hotel_id: hotelId,
        room_type_id: roomType.room_type_id,
        check_in: checkIn,
        check_out: checkOut,
        channel: "direct",
        total_amount: total,
        guest: {
          name: guestName.trim(),
          email: guestEmail.trim(),
          phone: guestPhone.trim(),
        },
      });
      setBooking(created);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear la reserva";
      const conflict = msg.includes("409") || msg.toLowerCase().includes("conflict");
      const unavailable =
        msg.toLowerCase().includes("available") ||
        msg.toLowerCase().includes("disponib") ||
        msg.toLowerCase().includes("inventory");
      setError(
        conflict
          ? "Otra reserva tomó esta habitación mientras la elegías. Cambiá las fechas o el tipo de habitación y volvé a intentar."
          : unavailable
            ? "No hay habitaciones disponibles para esas fechas. Probá otro rango de fechas."
            : `${msg}. Revisá los datos e intentá de nuevo.`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTransition = async (action: "confirm" | "cancel") => {
    if (!booking) return;
    setError(null);
    setSaving(true);
    try {
      const query =
        action === "cancel" && booking.manage_token
          ? `?token=${encodeURIComponent(booking.manage_token)}`
          : "";
      const updated = await postJson<Booking>(
        `/api/booking/bookings/${booking.booking_id}/${action}${query}`,
        {}
      );
      setBooking({ ...updated, manage_token: booking.manage_token });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar la reserva";
      const conflict = msg.includes("409") || msg.toLowerCase().includes("conflict");
      setError(
        conflict
          ? "La reserva cambió desde otro lado o el inventario ya no está disponible. Recargá la página para ver el estado actual."
          : `${msg}. Intentá de nuevo.`
      );
    } finally {
      setSaving(false);
    }
  };

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      setCopied(null);
    }
  };

  const statusLabel =
    booking?.status === "confirmed"
      ? "confirmada"
      : booking?.status === "cancelled"
        ? "cancelada"
        : "pendiente";
  const statusTitle =
    booking?.status === "confirmed"
      ? "¡Reserva confirmada!"
      : booking?.status === "cancelled"
        ? "Reserva cancelada"
        : "Reserva creada";
  const statusHint =
    booking?.status === "confirmed"
      ? "Tu habitación quedó reservada. Guardá el código de reserva."
      : booking?.status === "cancelled"
        ? "La reserva se canceló y el inventario se liberó. Podés empezar una nueva búsqueda."
        : "Tu lugar está apartado. Confirmá para asegurar la habitación.";

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      {!booking ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div
            aria-live="polite"
            className="rounded bg-gray-50 p-4 text-sm dark:bg-gray-700"
          >
            <p className="font-semibold">
              {hotelName} · {roomType.name}
            </p>
            {checkIn && checkOut && total !== null ? (
              <>
                <p className="mt-1 text-gray-600 dark:text-gray-300">
                  {formatDate(checkIn)} → {formatDate(checkOut)} · {nights}{" "}
                  {nights === 1 ? "noche" : "noches"}
                </p>
                <p className="mt-1 tabular-nums">
                  {nights} × {formatPrice(rate)} ={" "}
                  <span className="text-base font-bold">
                    {formatPrice(total)}
                  </span>
                </p>
              </>
            ) : (
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                Elegí las fechas para ver el total de tu estadía.
              </p>
            )}
          </div>
          <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <legend className={`${labelClass} sr-only`}>Datos del huésped</legend>
            <div>
              <label htmlFor="booking-guest-name" className={labelClass}>
                Nombre y apellido
              </label>
              <input
                id="booking-guest-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                autoComplete="name"
                className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label htmlFor="booking-guest-email" className={labelClass}>
                Correo
              </label>
              <input
                id="booking-guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label htmlFor="booking-guest-phone" className={labelClass}>
                Teléfono
              </label>
              <input
                id="booking-guest-phone"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                autoComplete="tel"
                className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
          </fieldset>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sin cuenta: el hotel te identifica con estos datos y un código de gestión.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <fieldset className="min-w-0">
              <legend className={labelClass}>Check-in</legend>
              <AvailabilityCalendar
                roomTypeId={roomType.room_type_id}
                selected={checkIn || undefined}
                onSelect={(iso) => {
                  setCheckIn(iso);
                  if (checkOut && checkOut <= iso) setCheckOut("");
                }}
              />
            </fieldset>
            <fieldset className="min-w-0">
              <legend className={labelClass}>Check-out</legend>
              <AvailabilityCalendar
                roomTypeId={roomType.room_type_id}
                selected={checkOut || undefined}
                onSelect={setCheckOut}
                minDate={checkIn || undefined}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Los días en verde tienen habitaciones libres.
              </p>
            </fieldset>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-press rounded bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50"
          >
            {saving ? <Spinner label="Creando…" /> : "Crear reserva"}
          </button>
        </form>
      ) : (
        <div>
          <h2 className="mb-2 text-xl font-semibold">{statusTitle}</h2>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            {statusHint}
          </p>
          <dl className="space-y-2 break-words text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <dt className="font-medium">Código de reserva:</dt>
              <dd className="font-mono text-xs">{booking.booking_id}</dd>
              <button
                type="button"
                onClick={() => void copyText("booking", booking.booking_id)}
                className="rounded border border-gray-300 px-2 py-0.5 text-xs font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700"
              >
                {copied === "booking" ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
            {booking.manage_token ? (
              <div className="flex flex-wrap items-center gap-2">
                <dt className="font-medium">Código de gestión:</dt>
                <dd className="font-mono text-xs">{booking.manage_token}</dd>
                <button
                  type="button"
                  onClick={() => void copyText("manage", booking.manage_token)}
                  className="rounded border border-gray-300 px-2 py-0.5 text-xs font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  {copied === "manage" ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            ) : null}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Guardá el código de gestión: sirve para ver o cancelar tu reserva sin cuenta.
            </p>
            <div className="flex gap-2">
              <dt className="font-medium">Estado:</dt>
              <dd>
                <span
                  className={`rounded px-2 py-0.5 font-semibold ${
                    booking.status === "confirmed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                      : booking.status === "cancelled"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                  }`}
                >
                  {statusLabel}
                </span>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">Estadía:</dt>
              <dd>
                {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">Total:</dt>
              <dd className="tabular-nums font-semibold">
                {formatPrice(booking.total_amount)}
              </dd>
            </div>
          </dl>
          {booking.status === "pending" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleTransition("confirm")}
                disabled={saving}
                className="btn-press rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50"
              >
                {saving ? <Spinner label="Procesando…" /> : "Confirmar reserva"}
              </button>
              <button
                type="button"
                onClick={() => handleTransition("cancel")}
                disabled={saving}
                className="btn-press rounded border border-gray-300 px-4 py-2 font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? <Spinner label="Procesando…" /> : "Cancelar reserva"}
              </button>
            </div>
          ) : null}
          {booking.status === "confirmed" ? (
            <div
              key={booking.booking_id}
              className="animate-notice-in mt-4 rounded bg-gradient-to-br from-green-50 to-emerald-100/60 p-3 dark:from-green-900/30 dark:to-emerald-900/10"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-green-800 dark:text-green-200">
                <svg
                  aria-hidden="true"
                  className="animate-check-draw h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12.5l5 5L20 6.5" />
                </svg>
                Reserva confirmada sin sobreventa
              </p>
              <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                {hotelName} · {roomType.name} · {formatDate(booking.check_in)} →{" "}
                {formatDate(booking.check_out)}. Presentá el código de reserva
                en recepción para el check-in.
              </p>
            </div>
          ) : null}
        </div>
      )}

      <div aria-live="polite" className="mt-4">
        {error ? (
          <p role="alert" className="animate-notice-in text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
