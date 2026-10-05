"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Booking } from "@/lib/api";
import { fetchMyBookings } from "@/lib/api-client";
import { me } from "@/lib/auth-client";
import { formatDate, formatPrice } from "@/lib/format";

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

  useEffect(() => {
    me().then((profile) => {
      if (!profile) {
        setError("Iniciá sesión para ver tus reservas y gestionar tus estadías.");
        return;
      }
      fetchMyBookings()
        .then(setBookings)
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "No se pudieron cargar tus reservas")
        );
    });
  }, []);

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2.5xl border border-amber-200/80 bg-amber-50/70 p-8 text-center shadow-sm dark:border-brand-gold/20 dark:bg-brand-navy-800"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-xl dark:bg-brand-navy-900">
          🔒
        </div>
        <h3 className="font-heading text-lg font-bold text-brand-navy dark:text-white">
          Acceso a tu cuenta
        </h3>
        <p className="mx-auto mt-1 mb-5 max-w-sm text-sm text-slate-600 dark:text-slate-300">
          {error}
        </p>
        <Link
          href="/cuenta/entrar"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 px-6 py-2.5 text-sm font-bold text-brand-navy shadow-gold transition-all duration-200 hover:brightness-105"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (!bookings) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2.5xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-brand-navy-700 dark:bg-brand-navy-800"
          >
            <div className="h-5 w-40 rounded bg-slate-200 dark:bg-brand-navy-700 mb-3" />
            <div className="h-4 w-60 rounded bg-slate-100 dark:bg-brand-navy-700/60" />
          </div>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2.5xl border border-slate-200/80 bg-white p-12 text-center shadow-card dark:border-brand-navy-700/80 dark:bg-brand-navy-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-2xl dark:bg-brand-navy-900">
          ✈️
        </div>
        <h3 className="font-heading text-xl font-bold text-brand-navy dark:text-white">
          Todavía no tenés reservas
        </h3>
        <p className="mx-auto mt-2 mb-6 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Cuando reserves una estadía, la vas a ver reflejada acá con su código, fechas y estado en vivo.
        </p>
        <Link
          href="/buscar"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 px-6 py-2.5 text-sm font-bold text-brand-navy shadow-gold transition-all duration-200 hover:brightness-105"
        >
          Explorar hoteles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => {
        const badge = STATUS_BADGES[b.status.toLowerCase()] ?? {
          label: b.status,
          class: "border-slate-200 bg-slate-100 text-slate-700",
        };

        return (
          <article
            key={b.booking_id}
            className="group relative overflow-hidden rounded-2.5xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-200 hover:border-brand-gold/40 hover:shadow-card-hover dark:border-brand-navy-700/80 dark:bg-brand-navy-800"
          >
            {/* Accent line on hover */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    ID #{b.booking_id.slice(0, 8)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.class}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold text-brand-navy dark:text-white">
                    {formatDate(b.check_in)}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-brand-navy dark:text-white">
                    {formatDate(b.check_out)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-6 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                <div className="text-right">
                  <span className="block text-xs uppercase tracking-wider text-slate-400">Total</span>
                  <span className="text-lg font-extrabold text-brand-navy dark:text-white tabular-nums">
                    {formatPrice(b.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
