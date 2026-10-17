"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Booking } from "@/lib/api";
import { fetchMyBookings } from "@/lib/api-client";
import { me } from "@/lib/auth-client";
import { formatDate, stayNights } from "@/lib/format";
import Money from "@/components/Money";
import { canPayOnline } from "@/lib/payment-eligibility";
import EmptyState from "@/components/EmptyState";
import PaymentBadge from "@/components/payments/PaymentBadge";
import PayOnlineModal from "@/components/payments/PayOnlineModal";

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  confirmed: {
    label: "Confirmada",
    class: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  pending: {
    label: "Pendiente",
    class: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300",
  },
  cancelled: {
    label: "Cancelada",
    class: "border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300",
  },
  completed: {
    label: "Completada",
    class: "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  },
};

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [paying, setPaying] = useState<Booking | null>(null);

  useEffect(() => {
    me().then((profile) => {
      if (!profile) {
        setError("Iniciá sesión para ver tus reservas y gestionar tus estadías.");
        return;
      }
      setUserId(profile.user_id);
      fetchMyBookings()
        .then(setBookings)
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "No se pudieron cargar tus reservas")
        );
    });
  }, []);

  function handlePaid(bookingId: string) {
    setBookings((prev) =>
      prev ? prev.map((b) => (b.booking_id === bookingId ? { ...b, payment_status: "PAID" } : b)) : prev
    );
    setPaying(null);
    // La confirmación llega por evento (`payment.completed`); reconciliamos luego.
    window.setTimeout(() => {
      fetchMyBookings().then(setBookings).catch(() => {});
    }, 2500);
  }

  if (error) {
    return (
      <EmptyState
        title="Entrá para ver tus reservas"
        description={error}
        actionHref="/cuenta/entrar"
        actionLabel="Iniciar sesión"
      />
    );
  }

  if (!bookings) {
    return (
      <div className="divide-y divide-brand-navy/10 border-y border-brand-navy/10 dark:divide-white/10 dark:border-white/10" aria-busy="true">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between py-8">
            <div className="space-y-3">
              <div className="skeleton h-6 w-64" />
              <div className="skeleton h-3 w-32" />
            </div>
            <div className="skeleton h-6 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        title="Todavía no tenés reservas"
        description="Cuando reserves una estancia la vas a ver acá, con su código, fechas y estado."
        actionHref="/buscar"
        actionLabel="Explorar hoteles"
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-brand-navy/10 border-y border-brand-navy/10 dark:divide-white/10 dark:border-white/10">
        {bookings.map((b, i) => {
          const badge = STATUS_BADGES[b.status.toLowerCase()] ?? {
            label: b.status,
            class: "border-slate-200 bg-slate-100 text-slate-700",
          };
        const nights = stayNights(b.check_in, b.check_out).length;

          return (
            <li
              key={b.booking_id}
              data-reveal=""
              style={{ ["--reveal-delay" as string]: `${Math.min(i, 5) * 60}ms` }}
              className="grid gap-4 py-8 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] ${badge.class}`}>
                    {badge.label}
                  </span>
                  {b.status !== "cancelled" && (
                    <PaymentBadge status={b.payment_status} preference={b.payment_method_preference} />
                  )}
                  <span className="font-mono text-[0.75rem] uppercase tracking-wider text-brand-navy/45 dark:text-white/40">
                    Reserva {b.booking_id.slice(0, 8)}
                  </span>
                </div>
                <p className="mt-4 font-display text-[1.75rem] leading-tight text-brand-navy dark:text-white">
                  {formatDate(b.check_in)}
                  <span aria-hidden="true" className="mx-3 inline-block h-px w-8 translate-y-[-0.3em] bg-current opacity-30" />
                  <span className="sr-only"> a </span>
                  {formatDate(b.check_out)}
                </p>
                {nights > 0 && (
                  <p className="mt-1 text-[0.875rem] text-brand-navy/55 dark:text-white/50">
                    {nights} {nights === 1 ? "noche" : "noches"}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:items-end">
                <span className="block text-eyebrow uppercase text-brand-navy/50 dark:text-white/45">
                  {b.payment_status === "PAID" ? "Total pagado" : "Total"}
                </span>
                <span className="font-display text-[1.75rem] tabular-nums text-brand-navy dark:text-white">
                  <Money amountCOP={b.total_amount} />
                </span>
                {canPayOnline(b, userId) && (
                  <button
                    type="button"
                    onClick={() => setPaying(b)}
                    className="btn-primary mt-4 w-full sm:w-auto"
                  >
                    Pagar ahora
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {paying && (
        <PayOnlineModal
          booking={paying}
          onClose={() => setPaying(null)}
          onPaid={() => handlePaid(paying.booking_id)}
        />
      )}
    </>
  );
}
