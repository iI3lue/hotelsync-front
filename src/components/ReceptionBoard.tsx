"use client";

import { useCallback, useEffect, useState } from "react";
import type { BookingRef, PhysicalRoom } from "@/lib/api";
import {
  fetchAssignment,
  fetchPhysicalRooms,
  postJson,
} from "@/lib/api-client";
import { useRoomNames } from "@/lib/use-room-names";
import HousekeepingStatus from "@/components/HousekeepingStatus";
import InvoicePanel from "@/components/InvoicePanel";

interface ReceptionBoardProps {
  hotelId: string;
  date: string;
}

const inputClass =
  "rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 touch-manipulation dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";

export default function ReceptionBoard({ hotelId, date }: ReceptionBoardProps) {
  const [arrivals, setArrivals] = useState<BookingRef[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<PhysicalRoom[]>([]);
  const [lastCheckout, setLastCheckout] = useState<{
    bookingId: string;
    roomNumber: string;
  } | null>(null);
  const [hiddenArrivalIds, setHiddenArrivalIds] = useState<string[]>([]);
  const [showHiddenArrivals, setShowHiddenArrivals] = useState(false);
  const roomNames = useRoomNames(hotelId);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/front-desk/arrivals?hotel_id=${encodeURIComponent(hotelId)}&date=${encodeURIComponent(date)}`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Error ${res.status}`);
        }
        setArrivals(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar las llegadas");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [hotelId, date]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetchPhysicalRooms(hotelId)
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, [hotelId]);

  // Ocultado local de llegadas (solo vista). Persiste en localStorage.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("hotelsync-hidden-arrivals");
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setHiddenArrivalIds(parsed.filter((v): v is string => typeof v === "string"));
      }
    } catch {
      // Sin persistencia: la vista funciona igual en la sesión.
    }
  }, []);

  const persistHiddenArrivals = (ids: string[]) => {
    setHiddenArrivalIds(ids);
    try {
      window.localStorage.setItem("hotelsync-hidden-arrivals", JSON.stringify(ids));
    } catch {
      // Sin persistencia igual funciona en la sesión.
    }
  };

  const visibleArrivals = (arrivals ?? []).filter(
    (b) => showHiddenArrivals || !hiddenArrivalIds.includes(b.booking_id)
  );

  const handleCheckIn = async (bookingId: string) => {
    const room = (rooms[bookingId] || "").trim();
    if (!room) {
      setError("Ingresá el número de habitación física para el check-in");
      return;
    }
    setBusy(bookingId);
    setError(null);
    try {
      await postJson("/api/front-desk/check-in", {
        booking_id: bookingId,
        physical_room_number: room,
      });
      // Optimista: el aviso sale al instante; la lista se revalida en fondo.
      setNotice(`Check-in OK: reserva ${bookingId.slice(0, 8)}… en habitación ${room}`);
      setBusy(null);
      void load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo hacer el check-in");
      setBusy(null);
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    setBusy(bookingId);
    setError(null);
    try {
      const assignment = await postJson<{
        booking_id: string;
        physical_room_number: string;
      }>("/api/front-desk/check-out", { booking_id: bookingId });
      // Optimista: el aviso sale al instante; la lista se revalida en fondo.
      setNotice(`Check-out OK: reserva ${bookingId.slice(0, 8)}… salió de la lista de llegadas (checkout.completed emitido)`);
      setLastCheckout({
        bookingId,
        roomNumber: assignment.physical_room_number,
      });
      setBusy(null);
      void load(true);
    } catch (err) {
      const raw =
        err instanceof Error ? err.message : "No se pudo hacer el check-out";
      if (/already checked out/i.test(raw)) {
        // La estadía ya está cerrada: mostrar cuándo en vez del error crudo.
        try {
          const assignment = await fetchAssignment(bookingId);
          const when = assignment.checked_out_at
            ? String(assignment.checked_out_at).slice(0, 16).replace("T", " ")
            : null;
          setError(null);
          setNotice(
            `Esa reserva ya hizo check-out${when ? ` el ${when}` : ""} en la habitación ${assignment.physical_room_number}. No hay nada por cerrar.`
          );
        } catch {
          setError(raw);
        }
      } else {
        setError(raw);
      }
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <p role="status" className="text-gray-500 dark:text-gray-400">
        Cargando llegadas…
      </p>
    );
  }

  return (
    <div>
      <div aria-live="polite">
        {error ? (
          <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="mb-4 rounded bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
            {notice}
          </p>
        ) : null}
      </div>

      {lastCheckout ? (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InvoicePanel bookingId={lastCheckout.bookingId} />
          <HousekeepingStatus
            hotelId={hotelId}
            roomNumber={lastCheckout.roomNumber}
            bookingId={lastCheckout.bookingId}
          />
        </div>
      ) : null}

      {!arrivals || visibleArrivals.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
          <p className="font-medium text-gray-700 dark:text-gray-200">
            {showHiddenArrivals || hiddenArrivalIds.length === 0
              ? "No hay llegadas confirmadas para esta fecha."
              : "Todas las llegadas de esta fecha están ocultas."}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Este tablero solo muestra confirmed del read model de Front Desk. Mirá la
            pestaña Reservas para ver las pending recién creadas en Booking.
          </p>
          {!showHiddenArrivals && hiddenArrivalIds.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowHiddenArrivals(true)}
              className="mt-4 ml-2 rounded border border-gray-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Mostrar ocultas ({hiddenArrivalIds.length})
            </button>
          ) : null}
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 rounded border border-gray-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Reintentar
            </button>
        </div>
      ) : (
        <div>
          <p role="status" className="mb-3 text-sm text-gray-600 tabular-nums dark:text-gray-300">
            {visibleArrivals.length === 1 ? "1 llegada confirmada" : `${visibleArrivals.length} llegadas confirmadas`}
            {showHiddenArrivals ? (
              <button
                type="button"
                onClick={() => setShowHiddenArrivals(false)}
                className="ml-2 underline underline-offset-2"
              >
                Ocultar de nuevo
              </button>
            ) : hiddenArrivalIds.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowHiddenArrivals(true)}
                className="ml-2 underline underline-offset-2"
              >
                Mostrar ocultas ({hiddenArrivalIds.length})
              </button>
            ) : null}
          </p>
        <ul className="space-y-4">
          {visibleArrivals.map((b) => (
            <li
              key={b.booking_id}
              className="rounded-lg bg-white p-4 shadow dark:bg-gray-800"
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 break-words">
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {b.booking_id.slice(0, 8)}…
                </span>
                {b.guest_name ? (
                  <span className="text-sm font-medium">{b.guest_name}</span>
                ) : null}
                <span className="text-sm font-medium">
                  {roomNames[b.room_type_id] ?? "Habitación"}
                </span>
                <span className="text-sm">
                  {b.check_in} → {b.check_out}
                </span>
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200">
                  {b.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label htmlFor={`room-${b.booking_id}`} className="sr-only">
                  Habitación física
                </label>
                <input
                  id={`room-${b.booking_id}`}
                  type="text"
                  placeholder="Hab. física (ej. 101)"
                  value={rooms[b.booking_id] || ""}
                  onChange={(e) =>
                    setRooms((prev) => ({ ...prev, [b.booking_id]: e.target.value }))
                  }
                  list={`catalog-${b.booking_id}`}
                  autoComplete="off"
                  className={`${inputClass} w-44`}
                />
                <datalist id={`catalog-${b.booking_id}`}>
                  {catalog.map((r) => (
                    <option key={r.physical_room_id} value={r.room_number}>
                      {r.roomType.name}
                    </option>
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={() => handleCheckIn(b.booking_id)}
                  disabled={busy === b.booking_id}
                  className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50"
                >
                  {busy === b.booking_id ? "Procesando…" : "Check-in"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCheckOut(b.booking_id)}
                  disabled={busy === b.booking_id}
                  className="rounded border border-gray-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Check-out
                </button>
                {showHiddenArrivals && hiddenArrivalIds.includes(b.booking_id) ? (
                  <button
                    type="button"
                    onClick={() =>
                      persistHiddenArrivals(
                        hiddenArrivalIds.filter((id) => id !== b.booking_id)
                      )
                    }
                    className="rounded border border-gray-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Restaurar
                  </button>
                ) : (
                  <button
                    type="button"
                    title="Quitar de la vista (solo local, no borra la llegada)"
                    onClick={() =>
                      persistHiddenArrivals([...hiddenArrivalIds, b.booking_id])
                    }
                    className="rounded border border-gray-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        </div>
      )}
    </div>
  );
}
