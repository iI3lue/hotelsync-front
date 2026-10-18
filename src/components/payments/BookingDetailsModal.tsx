"use client";

import { useEffect, useRef, useState } from "react";
import type { Booking } from "@/lib/api";
import { fetchHotels, fetchRoomTypes } from "@/lib/api-client";
import { formatDate, stayNights } from "@/lib/format";
import Money from "@/components/Money";
import PaymentBadge from "@/components/payments/PaymentBadge";

const METHOD_LABELS: Record<string, string> = {
  ONLINE: "Tarjeta en línea",
  RECEPTION: "Pago en recepción",
};

function formatPaidAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Detalle de una reserva pagada. Reutiliza los datos que ya vinieron en
 * "Mis reservas" y resuelve nombres de hotel/habitación contra property;
 * si esas llamadas fallan, muestra el detalle igual con guiones.
 */
export default function BookingDetailsModal({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const [hotelName, setHotelName] = useState<string | null>(null);
  const [roomTypeName, setRoomTypeName] = useState<string | null>(null);
  const [loadingNames, setLoadingNames] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const els = dialogRef.current.querySelectorAll<HTMLElement>(
          "button, [href]"
        );
        const list = Array.from(els).filter(
          (el) => !el.hasAttribute("disabled")
        );
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    const loadNames = async () => {
      const [hotelsResult, roomsResult] = await Promise.allSettled([
        fetchHotels(),
        fetchRoomTypes(booking.hotel_id),
      ]);
      if (!active) return;

      let nextHotelName: string | null = null;
      let nextRoomTypeName: string | null = null;

      if (hotelsResult.status === "fulfilled") {
        const hotel = hotelsResult.value.find(
          (h) => h.hotel_id === booking.hotel_id
        );
        nextHotelName = hotel?.name ?? null;
        const fallback = hotel?.roomTypes?.find(
          (r) => r.room_type_id === booking.room_type_id
        );
        nextRoomTypeName = fallback?.name ?? null;
      }
      if (roomsResult.status === "fulfilled") {
        const room = roomsResult.value.find(
          (r) => r.room_type_id === booking.room_type_id
        );
        if (room) nextRoomTypeName = room.name;
      }

      setHotelName(nextHotelName);
      setRoomTypeName(nextRoomTypeName);
      setLoadingNames(false);
    };
    void loadNames();
    return () => {
      active = false;
    };
  }, [booking.hotel_id, booking.room_type_id]);

  const nights = stayNights(booking.check_in, booking.check_out).length;
  const row = "flex items-baseline justify-between gap-4 py-3";
  const value = "text-right text-brand-navy dark:text-white";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-details-title"
        className="animate-slide-up-sm w-full max-w-xl overflow-y-auto max-h-[92vh] bg-white p-7 shadow-elevated dark:bg-brand-navy-800 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Detalle de reserva</p>
            <h2
              id="booking-details-title"
              className="mt-2 font-display text-[1.75rem] leading-tight text-brand-navy dark:text-white"
            >
              Tu reserva pagada
            </h2>
            <p className="mt-1 font-mono text-[0.8rem] text-brand-navy/55 dark:text-white/50">
              {booking.booking_id}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1 text-brand-navy/50 hover:text-brand-navy dark:text-white/50 dark:hover:text-white"
          >
            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          </button>
        </div>

        <div className="mt-6 flex items-baseline justify-between border-y border-brand-navy/10 py-4 dark:border-white/10">
          <span className="eyebrow">Total pagado</span>
          <span className="font-display text-[2rem] leading-none tabular-nums text-brand-navy dark:text-white">
            <Money amountCOP={booking.total_amount} />
          </span>
        </div>

        <dl className="divide-y divide-brand-navy/10 border-b border-brand-navy/10 text-[0.925rem] dark:divide-white/10 dark:border-white/10">
          <div className={row}>
            <dt className="text-brand-navy/55 dark:text-white/50">Hotel</dt>
            <dd className={value}>
              {loadingNames ? "Cargando…" : (hotelName ?? "—")}
            </dd>
          </div>
          <div className={row}>
            <dt className="text-brand-navy/55 dark:text-white/50">
              Habitación
            </dt>
            <dd className={value}>
              {loadingNames ? "Cargando…" : (roomTypeName ?? "—")}
            </dd>
          </div>
          {booking.guest_name && (
            <div className={row}>
              <dt className="text-brand-navy/55 dark:text-white/50">
                Huésped
              </dt>
              <dd className={value}>{booking.guest_name}</dd>
            </div>
          )}
          <div className={row}>
            <dt className="text-brand-navy/55 dark:text-white/50">Estancia</dt>
            <dd className={value}>
              {formatDate(booking.check_in)} — {formatDate(booking.check_out)}
            </dd>
          </div>
          {nights > 0 && (
            <div className={row}>
              <dt className="text-brand-navy/55 dark:text-white/50">Noches</dt>
              <dd className={value}>{nights}</dd>
            </div>
          )}
          <div className={row}>
            <dt className="text-brand-navy/55 dark:text-white/50">Estado</dt>
            <dd className={value}>
              <PaymentBadge
                status="PAID"
                preference={booking.payment_method_preference}
              />
            </dd>
          </div>
          <div className={row}>
            <dt className="text-brand-navy/55 dark:text-white/50">Método</dt>
            <dd className={value}>
              {booking.payment_method_preference
                ? (METHOD_LABELS[booking.payment_method_preference] ??
                  booking.payment_method_preference)
                : "—"}
            </dd>
          </div>
          <div className={row}>
            <dt className="text-brand-navy/55 dark:text-white/50">
              Fecha de pago
            </dt>
            <dd className={value}>
              {booking.paid_at ? formatPaidAt(booking.paid_at) : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-8">
          <button type="button" onClick={onClose} className="btn-primary w-full">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
