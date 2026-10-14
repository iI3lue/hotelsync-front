"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import type { BookingRef } from "@/lib/api";
import { postJson } from "@/lib/api-client";
import { timeoutSignal } from "@/lib/timeout-signal";
import { useRoomNames } from "@/lib/use-room-names";
import PaymentBadge from "@/components/payments/PaymentBadge";

interface BookingsAutoTableProps {
  hotelId: string;
  date: string;
}

type StatusFilter = "all" | "pending" | "confirmed" | "cancelled";

function statusBadge(status: string): string {
  if (status === "confirmed")
    return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
  if (status === "cancelled")
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
  return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
}

async function fetchBookings(
  hotelId: string,
  date: string,
  status: StatusFilter
): Promise<BookingRef[]> {
  const params = new URLSearchParams({ hotel_id: hotelId });
  // Fecha vacía = todas las fechas (el backend deja `date` opcional).
  if (date) params.set("date", date);
  if (status !== "all") params.set("status", status);
  const res = await fetch(`/api/booking/bookings?${params.toString()}`, {
    signal: timeoutSignal(10000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

export default function BookingsAutoTable({ hotelId, date }: BookingsAutoTableProps) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const roomNames = useRoomNames(hotelId);

  const {
    data: bookings,
    error: swrError,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<BookingRef[]>(
    ["bookings", hotelId, date, status],
    ([, h, d, s]: [string, string, string, StatusFilter]) =>
      fetchBookings(h as string, d as string, s as StatusFilter),
    {
      refreshInterval: 20000,
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  );
  const error = swrError instanceof Error ? swrError.message : null;

  useEffect(() => {
    if (bookings) setUpdatedAt(new Date().toLocaleTimeString("es-CO"));
  }, [bookings]);

  const handleTransition = async (bookingId: string, action: "confirm" | "cancel") => {
    setBusy(bookingId);
    setNotice(null);
    setActionError(null);
    const previous = bookings;
    const nextStatus = action === "confirm" ? "confirmed" : "cancelled";
    // Optimista: la fila cambia al instante; rollback si falla.
    await mutate(
      (rows) =>
        rows?.map((b) =>
          b.booking_id === bookingId ? { ...b, status: nextStatus } : b
        ),
      false
    );
    try {
      await postJson(`/api/booking/bookings/${bookingId}/${action}`, {});
      setNotice(
        action === "confirm"
          ? `Reserva ${bookingId.slice(0, 8)}… confirmada (inventario reservado, llegará a Front Desk por evento).`
          : `Reserva ${bookingId.slice(0, 8)}… cancelada.`
      );
    } catch (err) {
      await mutate(previous, false);
      const msg = err instanceof Error ? err.message : "La operación falló";
      const conflict =
        msg.includes("409") || msg.toLowerCase().includes("conflict");
      const unavailable =
        msg.toLowerCase().includes("disponib") ||
        msg.toLowerCase().includes("availab");
      // Nunca fallar en silencio: la fila vuelve a su estado pero el motivo
      // queda visible (antes se "reiniciaba" sin explicar nada).
      setActionError(
        action === "confirm" && (conflict || unavailable)
          ? `No se pudo confirmar la reserva ${bookingId.slice(0, 8)}…: sin disponibilidad para esas fechas.`
          : `No se pudo ${action === "confirm" ? "confirmar" : "cancelar"} la reserva ${bookingId.slice(0, 8)}…: ${msg}`
      );
      void mutate();
      return;
    } finally {
      setBusy(null);
    }
    void mutate();
  };

  if (isLoading && !bookings) {
    return (
      <p role="status" className="text-gray-500 dark:text-gray-400">
        Cargando reservas automáticamente…
      </p>
    );
  }

  return (
    <div>
      <div aria-live="polite">
        {error ? (
          <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
            {error}{" "}
            <button type="button" onClick={() => void mutate()} className="underline underline-offset-2">
              Reintentar
            </button>
          </p>
        ) : null}
        {actionError ? (
          <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
            {actionError}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="mb-4 rounded bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
            {notice}
          </p>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por estado">
        {(["all", "pending", "confirmed", "cancelled"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              status === s
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {s === "all" ? "Todas" : s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void mutate()}
          className="ml-auto rounded border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Actualizar ahora
        </button>
      </div>

      {updatedAt ? (
        <p role="status" className="mb-3 text-xs text-gray-500 tabular-nums dark:text-gray-400">
          Fuente: Booking Service (todas las recién creadas, pending incluidas). Actualizado {updatedAt} · auto cada 20s.
          {isValidating ? " · actualizando…" : ""}
        </p>
      ) : null}

      {!bookings || bookings.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
          <p className="font-medium text-gray-700 dark:text-gray-200">No hay reservas para este filtro.</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Creá una desde la web y aparece sola acá sin consultar manual.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
          <p role="status" className="px-4 pt-3 text-sm text-gray-600 tabular-nums dark:text-gray-300">
            {bookings.length === 1 ? "1 reserva" : `${bookings.length} reservas`}
          </p>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">ID</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Habitación</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Estadía</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Estado</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Pago</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Canal</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {bookings.map((b) => (
                <tr key={b.booking_id}>
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{b.booking_id.slice(0, 8)}…</td>
                  <td className="whitespace-nowrap px-4 py-2">{roomNames[b.room_type_id] ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2 tabular-nums">{b.check_in} → {b.check_out}</td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusBadge(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    {b.status === "cancelled" ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <PaymentBadge size="sm" status={b.payment_status} preference={b.payment_method_preference} />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">{b.channel}</td>
                  <td className="whitespace-nowrap px-4 py-2">
                    {b.status === "pending" ? (
                      <span className="inline-flex gap-1">
                        <button
                          type="button"
                          disabled={busy === b.booking_id}
                          onClick={() => void handleTransition(b.booking_id, "confirm")}
                          className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          disabled={busy === b.booking_id}
                          onClick={() => void handleTransition(b.booking_id, "cancel")}
                          className="rounded border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
