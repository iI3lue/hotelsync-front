"use client";

import { useEffect, useRef, useState } from "react";
import type { Booking } from "@/lib/api";
import { ApiError, cancelBooking } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import Money from "@/components/Money";
import Spinner from "@/components/Spinner";

/**
 * Confirmación de cancelación desde "Mis reservas". La reserva no se borra:
 * queda `cancelled` y desaparece de la lista. Si estaba paga, payment-service
 * emite un reembolso simulado y la marca REFUNDED.
 */
export default function CancelBookingModal({
  booking,
  onClose,
  onCancelled,
}: {
  booking: Pick<
    Booking,
    "booking_id" | "check_in" | "check_out" | "total_amount" | "payment_status"
  >;
  onClose: () => void;
  onCancelled: (bookingId: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const wasPaid = booking.payment_status === "PAID";

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const els = dialogRef.current.querySelectorAll<HTMLElement>("button, [href]");
        const list = Array.from(els).filter((el) => !el.hasAttribute("disabled"));
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
  }, [onClose, saving]);

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      await cancelBooking(booking.booking_id);
      onCancelled(booking.booking_id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cancelar la reserva. Intentá de nuevo."
      );
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-booking-title"
        className="animate-slide-up-sm w-full max-w-lg overflow-y-auto max-h-[92vh] bg-white p-7 shadow-elevated dark:bg-brand-navy-800 sm:p-8"
      >
        <p className="eyebrow">Cancelar reserva</p>
        <h2
          id="cancel-booking-title"
          className="mt-2 font-display text-[1.75rem] leading-tight text-brand-navy dark:text-white"
        >
          ¿Cancelamos esta estadía?
        </h2>
        <p className="mt-1 font-mono text-[0.8rem] text-brand-navy/55 dark:text-white/50">
          {booking.booking_id}
        </p>

        <div className="mt-6 space-y-2 border-y border-brand-navy/10 py-4 text-[0.925rem] dark:border-white/10">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-brand-navy/55 dark:text-white/50">Estancia</span>
            <span className="text-right text-brand-navy dark:text-white">
              {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-brand-navy/55 dark:text-white/50">Total</span>
            <span className="text-right font-display text-[1.35rem] tabular-nums text-brand-navy dark:text-white">
              <Money amountCOP={booking.total_amount} />
            </span>
          </div>
        </div>

        <p className="mt-5 text-[0.9rem] leading-relaxed text-brand-navy/70 dark:text-white/60">
          La reserva quedará cancelada y se liberará la habitación. Esta acción
          no se puede deshacer.
        </p>
        {wasPaid && (
          <p className="mt-3 border-l-2 border-sky-400 pl-3 text-[0.875rem] leading-relaxed text-sky-800 dark:text-sky-300">
            El pago se reembolsará de forma simulada: la reserva figurará como
            reembolsada al instante.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 text-[0.875rem] text-red-700 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-outline w-full sm:w-auto"
          >
            Conservar reserva
          </button>
          <button
            ref={cancelRef}
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="btn-primary w-full sm:w-auto"
          >
            {saving ? (
              <Spinner label="Cancelando." />
            ) : (
              "Sí, cancelar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
