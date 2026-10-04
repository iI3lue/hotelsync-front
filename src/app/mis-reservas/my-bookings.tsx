"use client";

import { useEffect, useState } from "react";
import type { Booking } from "@/lib/api";
import { fetchMyBookings } from "@/lib/api-client";
import { me } from "@/lib/auth-client";
import { formatDate, formatPrice } from "@/lib/format";

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    me().then((profile) => {
      if (!profile) {
        setError("Iniciá sesión para ver tus reservas.");
        return;
      }
      fetchMyBookings()
        .then(setBookings)
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "No se pudieron cargar")
        );
    });
  }, []);

  if (error) {
    return (
      <p role="alert" className="rounded bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
        {error}{" "}
        <a href="/admin/login" className="font-medium underline">
          Ir a acceder
        </a>
      </p>
    );
  }

  if (!bookings) {
    return (
      <p role="status" className="text-gray-500 dark:text-gray-400">
        Cargando tus reservas…
      </p>
    );
  }

  if (bookings.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
        Todavía no tenés reservas asociadas a tu cuenta.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {bookings.map((b) => (
        <li
          key={b.booking_id}
          className="rounded-lg bg-white p-4 shadow dark:bg-gray-800"
        >
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 break-words">
            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
              {b.booking_id.slice(0, 8)}…
            </span>
            <span className="text-sm">
              {formatDate(b.check_in)} → {formatDate(b.check_out)}
            </span>
            <span className="text-sm font-medium tabular-nums">
              {formatPrice(b.total_amount)}
            </span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold dark:bg-gray-700">
              {b.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
