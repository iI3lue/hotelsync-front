"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  fetchPaymentStatusForStaff,
  processFrontDeskPayment,
  type ManualPaymentMethod,
  type PaymentStatusInfo,
  type PaymentTransaction,
} from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import Spinner from "@/components/Spinner";

export interface PayableBooking {
  booking_id: string;
  guest_name?: string | null;
  total_amount: number | string;
  check_in: string;
  check_out: string;
}

const METHODS: { value: ManualPaymentMethod; label: string; hint: string }[] = [
  { value: "CASH", label: "Efectivo", hint: "Cobro en caja" },
  { value: "TERMINAL", label: "Datáfono", hint: "Tarjeta física" },
  { value: "TRANSFER", label: "Transferencia", hint: "Comprobante bancario" },
];

const METHOD_LABEL: Record<string, string> = {
  CASH: "Efectivo",
  TERMINAL: "Datáfono",
  TRANSFER: "Transferencia",
  CREDIT_CARD: "Tarjeta en la web",
};

/**
 * Modal "Registrar pago" de recepción (Flujo B). Antes de cobrar consulta
 * payment-service: si la reserva ya se pagó en línea, lo muestra y no deja
 * cobrar de nuevo (el backend tampoco lo permitiría: idempotencia).
 */
export default function RegisterPaymentModal({
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
  const [method, setMethod] = useState<ManualPaymentMethod>("CASH");
  const [receivedBy, setReceivedBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetchPaymentStatusForStaff(booking.booking_id)
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
  }, [onClose, saving, loading]);

  const amount = status?.amount_due ?? Number(booking.total_amount);
  const alreadyPaid = status?.payment_status === "PAID" ? status.transaction : null;

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await processFrontDeskPayment(booking.booking_id, method, receivedBy.trim() || undefined);
      onPaid(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setError("No podés registrar pagos de otro hotel.");
      else if (err instanceof ApiError && err.status === 409) setError(err.message);
      else setError(err instanceof Error ? `${err.message}. Intentá de nuevo.` : "No se pudo registrar el pago.");
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
        aria-labelledby="pay-modal-title"
        className="animate-slide-up-sm w-full max-w-lg bg-white p-7 shadow-elevated dark:bg-brand-navy-800 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Registrar pago</p>
            <h2 id="pay-modal-title" className="mt-2 font-display text-[1.75rem] leading-tight text-brand-navy dark:text-white">
              {booking.guest_name || "Huésped"}
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
          <span className="eyebrow">{alreadyPaid ? "Pagado" : "Saldo a cobrar"}</span>
          <span className="font-display text-[2rem] leading-none tabular-nums text-brand-navy dark:text-white">{formatPrice(amount)}</span>
        </div>

        {loading ? (
          <div className="py-8 text-brand-navy/60 dark:text-white/55"><Spinner label="Consultando el estado del pago…" /></div>
        ) : alreadyPaid ? (
          <div className="mt-6 space-y-6">
            <p className="border-l-2 border-emerald-600 bg-emerald-50 p-4 text-[0.9rem] text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              Esta reserva ya está pagada ({METHOD_LABEL[alreadyPaid.method] ?? alreadyPaid.method}
              {alreadyPaid.card_last4 ? ` •••• ${alreadyPaid.card_last4}` : ""}). No hace falta cobrar en recepción.
            </p>
            <button type="button" onClick={() => onPaid(alreadyPaid)} className="btn-primary w-full">Entendido</button>
          </div>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
            <fieldset disabled={saving}>
              <legend className="input-label">Medio de pago</legend>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((m, i) => (
                  <label
                    key={m.value}
                    className={`flex cursor-pointer flex-col gap-0.5 border px-3 py-3 transition-colors ${
                      method === m.value
                        ? "border-brand-navy bg-brand-navy/[0.03] dark:border-white dark:bg-white/5"
                        : "border-brand-navy/15 hover:border-brand-navy/40 dark:border-white/15"
                    }`}
                  >
                    <input
                      ref={i === 0 ? firstRef : undefined}
                      type="radio"
                      name="front-desk-method"
                      value={m.value}
                      checked={method === m.value}
                      onChange={() => setMethod(m.value)}
                      className="sr-only"
                    />
                    <span className="text-[0.95rem] text-brand-navy dark:text-white">{m.label}</span>
                    <span className="text-[0.75rem] text-brand-navy/50 dark:text-white/45">{m.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="received-by" className="input-label">Referencia (opcional)</label>
              <input
                id="received-by"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value.slice(0, 100))}
                placeholder="Caja, nº de comprobante o quién recibió"
                className="input-field"
                disabled={saving}
              />
            </div>

            <div aria-live="polite">
              {error && <p role="alert" className="border-l-2 border-red-600 bg-red-50 p-3 text-[0.875rem] text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={saving} className="btn-outline">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Spinner label="Registrando…" /> : `Registrar ${formatPrice(amount)}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
