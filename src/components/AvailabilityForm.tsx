"use client";

import { useState, useTransition } from "react";
import useSWR from "swr";
import type { Availability, RoomType } from "@/lib/api";
import { formatDate } from "@/lib/format";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import Spinner from "@/components/Spinner";

interface AvailabilityFormProps {
  hotelId: string;
  roomTypes: RoomType[];
  initialRoomTypeId?: string;
  initialDate?: string;
  initialAvailability?: Availability | null;
}

const fetcher = async (url: string): Promise<Availability> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo consultar la disponibilidad");
  return res.json();
};

const inputClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 touch-manipulation dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200";

export default function AvailabilityForm({
  hotelId,
  roomTypes,
  initialRoomTypeId = "",
  initialDate = "",
  initialAvailability = null,
}: AvailabilityFormProps) {
  const [roomId, setRoomId] = useState(initialRoomTypeId);
  const [date, setDate] = useState(initialDate);
  const [submitted, setSubmitted] = useState<{
    roomId: string;
    date: string;
  } | null>(
    initialRoomTypeId && initialDate
      ? { roomId: initialRoomTypeId, date: initialDate }
      : null
  );
  const [isPending, startTransition] = useTransition();

  const key =
    submitted && submitted.roomId && submitted.date
      ? `/api/rate/availability?room_type_id=${encodeURIComponent(submitted.roomId)}&date=${encodeURIComponent(submitted.date)}`
      : null;
  const { data, error, isLoading } = useSWR<Availability>(key, fetcher, {
    fallbackData: initialAvailability ?? undefined,
    revalidateOnFocus: false,
  });

  const selectedRoom = roomTypes.find((r) => r.room_type_id === (submitted?.roomId ?? roomId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = { roomId, date };
    startTransition(() => {
      setSubmitted(next);
    });
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="room-type-select" className={labelClass}>
            Tipo de habitación
          </label>
          {roomTypes.length > 0 ? (
            <select
              id="room-type-select"
              name="room_type_id"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Elegí una opción…</option>
              {roomTypes.map((room) => (
                <option key={room.room_type_id} value={room.room_type_id}>
                  {room.name} · máx. {room.capacity}{" "}
                  {room.capacity === 1 ? "huésped" : "huéspedes"}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="room-type-select"
              name="room_type_id"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Pegá el ID del tipo…"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={inputClass}
              required
            />
          )}
        </div>
        <fieldset className="min-w-0">
          <legend className={labelClass}>Fecha</legend>
          <AvailabilityCalendar
            roomTypeId={roomId || undefined}
            selected={date || undefined}
            onSelect={setDate}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {roomId
              ? "Los días en verde tienen habitaciones libres."
              : "Elegí un tipo de habitación para ver los días libres."}
          </p>
        </fieldset>
        <button
          type="submit"
          disabled={isPending || isLoading || !roomId || !date}
          className="btn-press rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50"
        >
          {isPending || isLoading ? <Spinner label="Consultando…" /> : "Consultar disponibilidad"}
        </button>
      </form>

      <div aria-live="polite" className="mt-4">
        {error ? (
          <p role="alert" className="animate-notice-in text-red-600 dark:text-red-400">
            No se pudo consultar la disponibilidad. Probá con otra fecha o
            recargá la página.
          </p>
        ) : null}
        {data ? (
          <div
            key={`${submitted?.roomId}-${submitted?.date}`}
            className="animate-notice-in mt-2 rounded bg-gray-50 p-4 dark:bg-gray-700"
          >
            <h3 className="mb-2 font-semibold">
              Resultado{date || submitted?.date ? ` · ${formatDate(date || submitted?.date || "")}` : ""}
            </h3>
            {selectedRoom ? (
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                {selectedRoom.name} · máx. {selectedRoom.capacity}{" "}
                {selectedRoom.capacity === 1 ? "huésped" : "huéspedes"}
              </p>
            ) : null}
            <p className="tabular-nums">
              Habitaciones disponibles:{" "}
              <span className="font-bold text-green-600 dark:text-green-400">
                {data.available}
              </span>
            </p>
            {data.available === 0 ? (
              <p className="mt-2 font-semibold text-red-600 dark:text-red-400">
                No hay habitaciones disponibles para esta fecha. Probá con otro
                día.
              </p>
            ) : data.available <= 2 ? (
              <p className="mt-2 font-semibold text-amber-700 dark:text-amber-300">
                ¡Quedan solo {data.available}! Elegí tu día y continuá con la
                reserva.
              </p>
            ) : null}
            {data.available > 0 && submitted ? (
              <a
                href={`/reservas/nueva?hotel=${encodeURIComponent(hotelId)}&room_type_id=${encodeURIComponent(submitted.roomId)}&date=${encodeURIComponent(submitted.date)}`}
                className="mt-4 inline-block rounded bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 touch-manipulation"
              >
                Continuar con la reserva
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
