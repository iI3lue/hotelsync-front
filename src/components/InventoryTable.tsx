"use client";

import { useState } from "react";
import { blockInventory } from "@/lib/api-client";
import type { RoomType } from "@/lib/api";
import DatePickerButton from "@/components/DatePickerButton";

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200";

export default function InventoryTable({
  hotelId,
  roomTypes,
}: {
  hotelId: string;
  roomTypes: RoomType[];
}) {
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.room_type_id ?? "");
  const [date, setDate] = useState("");
  const [count, setCount] = useState(1);
  const [action, setAction] = useState<"block" | "unblock">("block");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    available: number;
    blocked: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomTypeId || !date) {
      setError("Elegí el tipo de habitación y la fecha en el calendario");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await blockInventory({
        room_type_id: roomTypeId,
        date,
        count,
        action,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo actualizar el inventario. Verificá los datos e intentá de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p
          role="alert"
          className="text-red-600 bg-red-50 p-3 rounded dark:bg-red-900/30 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="inventory-room-type" className={labelClass}>
            Tipo de habitación
          </label>
          {roomTypes.length > 0 ? (
            <select
              id="inventory-room-type"
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Elegí una opción…</option>
              {roomTypes.map((r) => (
                <option key={r.room_type_id} value={r.room_type_id}>
                  {r.name} · máx. {r.capacity}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Este hotel todavía no tiene tipos de habitación cargados.
            </p>
          )}
        </div>
        <div>
          <DatePickerButton label="Fecha" value={date} onChange={setDate} />
        </div>
        <div>
          <label htmlFor="inventory-count" className={labelClass}>
            Cantidad
          </label>
          <input
            id="inventory-count"
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min={1}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="inventory-action" className={labelClass}>
            Acción
          </label>
          <select
            id="inventory-action"
            value={action}
            onChange={(e) => setAction(e.target.value as "block" | "unblock")}
            className={inputClass}
          >
            <option value="block">Bloquear</option>
            <option value="unblock">Desbloquear</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50"
      >
        {loading ? "Procesando..." : "Actualizar inventario"}
      </button>

      {result && (
        <div
          role="status"
          className="mt-4 p-4 bg-gray-50 rounded dark:bg-gray-700"
        >
          <p>
            Disponibles: <strong>{result.available}</strong>
          </p>
          <p>
            Bloqueadas: <strong>{result.blocked}</strong>
          </p>
        </div>
      )}
    </form>
  );
}
