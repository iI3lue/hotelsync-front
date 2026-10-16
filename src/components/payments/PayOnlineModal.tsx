"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  fetchPaymentStatus,
  processWebPayment,
  type PaymentStatusInfo,
  type PaymentTransaction,
} from "@/lib/api-client";
import {
  digitsOnly,
  parseExpiry,
  validateCard,
  type CardErrors,
  type CardFields,
} from "@/lib/card";
import { formatPrice } from "@/lib/format";
import CardForm from "@/components/payments/CardForm";
import Spinner from "@/components/Spinner";

export interface PayableBooking {
  booking_id: string;
  guest_name?: string | null;
  total_amount: number | string;
  check_in: string;
  check_out: string;
}

const EMPTY_CARD: CardFields = { number: "", expiry: "", cvc: "", holder: "" };

/**
 * Modal "Pagar ahora" del huésped (Flujo A). Cobra la reserva con tarjeta
 * usando el Bearer de la sesión (sin manage token). Antes de cobrar consulta
 * payment-service: si ya figura pagada, lo muestra y no deja cobrar de nuevo
 * (el backend es idempotente por reserva de todos modos).
 */
export default function PayOnlineModal({
  booking,
  onClose,
  onPaid,
}: {
  booking: PayableBooking;
  onClose: () => void;
  onPaid: (tx: PaymentTransaction) => void;
}) {
  const [status, setStatus] = useState<PaymentStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<CardFields>(EMPTY_CARD);
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetchPaymentStatus(booking.booking_id)
      .then((s) => active && setStatus(s))
      .catch(() => active && setStatus(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [booking.booking_id]);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
      // Trampa de foco mínima dentro del diálogo.
      if (e.key === "Tab" && dialogRef.current) {
        const els = dialogRef.current.querySelectorAll<HTMLElement>("button, input, [href]");
        const list = Array.from(els).filter((el) => !el.hasAttribute("disabled"));
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const amount = status?.amount_due ?? Number(booking.total_amount);
  const alreadyPaid = status?.payment_status === "PAID" ? status.transaction : null;

  async function submit() {
    const errs = validateCard(card);
    setCardErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setError(null);
    const exp = parseExpiry(card.expiry)!;
    try {
      const res = await processWebPayment(booking.booking_id, {
        number: digitsOnly(card.number),
        exp_month: exp.month,
        exp_year: exp.year,
        cvc: card.cvc,
        holder: card.holder.trim(),
      });
      onPaid(res.data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 402) {
          setCard((c) => ({ ...c, cvc: "" }));
          setError(`${err.message}. No se hizo ningún cobro: probá con otra tarjeta.`);
        } else if (err.status === 409 && err.code === "PaymentInProgress") {
          setError("Ya hay un pago en curso para esta reserva. Esperá unos segundos y volvé a intentar.");
        } else if (err.status === 429) {
          setError("Se alcanzó el máximo de intentos de pago para esta reserva.");
        } else {
          setError(err.message);
        }
        return;
      }
      // Red caída o timeout: el resultado es incierto. Nunca se reintenta el
      // cobro a ciegas; se consulta el estado (el servidor es idempotente).
      try {
        const fresh = await fetchPaymentStatus(booking.booking_id);
        if (fresh.transaction?.status === "COMPLETED") {
          onPaid(fresh.transaction);
          return;
        }
        setError("Se cortó la conexión y el pago no llegó a procesarse. Podés intentarlo de nuevo.");
      } catch {
        setError("Se cortó la conexión. Antes de reintentar, revisá en Mis reservas si el pago figura.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-online-title"
        className="animate-slide-up-sm w-full max-w-lg overflow-y-auto max-h-[92vh] bg-white p-7 shadow-elevated dark:bg-brand-navy-800 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Pagar reserva</p>
            <h2 id="pay-online-title" className="mt-2 font-display text-[1.75rem] leading-tight text-brand-navy dark:text-white">
              Pagar ahora
            </h2>
            <p className="mt-1 text-[0.85rem] text-brand-navy/55 dark:text-white/50">
              Reserva <span className="font-mono">{booking.booking_id.slice(0, 8)}</span> · {booking.check_in} → {booking.check_out}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Cerrar" className="p-1 text-brand-navy/50 hover:text-brand-navy dark:text-white/50 dark:hover:text-white">
            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" /></svg>
          </button>
        </div>

        <div className="mt-6 flex items-baseline justify-between border-y border-brand-navy/10 py-4 dark:border-white/10">
          <span className="eyebrow">{alreadyPaid ? "Pagado" : "Total a pagar"}</span>
          <span className="font-display text-[2rem] leading-none tabular-nums text-brand-navy dark:text-white">{formatPrice(amount)}</span>
        </div>

        {loading ? (
          <div className="py-8 text-brand-navy/60 dark:text-white/55"><Spinner label="Consultando el estado del pago…" /></div>
        ) : alreadyPaid ? (
          <div className="mt-6 space-y-6">
            <p className="border-l-2 border-emerald-600 bg-emerald-50 p-4 text-[0.9rem] text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              Esta reserva ya está pagada
              {alreadyPaid.card_last4 ? ` •••• ${alreadyPaid.card_last4}` : ""}. No hace falta volver a pagar.
            </p>
            <button type="button" onClick={onClose} className="btn-primary w-full">Entendido</button>
          </div>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
            <CardForm value={card} onChange={setCard} errors={cardErrors} disabled={saving} />

            <div aria-live="polite">
              {error && <p role="alert" className="border-l-2 border-red-600 bg-red-50 p-3 text-[0.875rem] text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={saving} className="btn-outline">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Spinner label="Procesando el pago…" /> : `Pagar ${formatPrice(amount)}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
