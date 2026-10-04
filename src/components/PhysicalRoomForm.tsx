"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RoomType } from "@/lib/api";
import { createPhysicalRoom } from "@/lib/api-client";

const inputClass =
  "w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200";

function localDate(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function PhysicalRoomForm({
  hotelId,
  roomTypes,
}: {
  hotelId: string;
  roomTypes: RoomType[];
}) {
  const router = useRouter();
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.room_type_id ?? "");
  const [roomNumber, setRoomNumber] = useState("");
  const [availableFrom, setAvailableFrom] = useState(localDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await createPhysicalRoom({
        hotel_id: hotelId,
        room_type_id: roomTypeId,
        room_number: roomNumber.trim(),
        available_from: availableFrom,
      });
      setRoomNumber("");
      setSuccess("Habitación registrada. La disponibilidad se actualizará en R&A.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la habitación. Revisá los datos e intentá de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <p
          role="status"
          aria-live="polite"
          className="rounded bg-green-50 p-3 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        >
          {success}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}

      {roomTypes.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Primero creá un tipo de habitación para poder registrar unidades físicas.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="physical-room-number" className={labelClass}>
                Número de habitación
              </label>
              <input
                id="physical-room-number"
                type="text"
                value={roomNumber}
                onChange={(event) => setRoomNumber(event.target.value)}
                maxLength={20}
                autoComplete="off"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="physical-room-type" className={labelClass}>
                Tipo de habitación
              </label>
              <select
                id="physical-room-type"
                value={roomTypeId}
                onChange={(event) => setRoomTypeId(event.target.value)}
                className={inputClass}
                required
              >
                {roomTypes.map((roomType) => (
                  <option key={roomType.room_type_id} value={roomType.room_type_id}>
                    {roomType.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="physical-room-available-from" className={labelClass}>
                Disponible desde
              </label>
              <input
                id="physical-room-available-from"
                type="date"
                value={availableFrom}
                onChange={(event) => setAvailableFrom(event.target.value)}
                min={localDate()}
                className={inputClass}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Registrando…" : "Registrar habitación"}
          </button>
        </>
      )}
    </form>
  );
}
