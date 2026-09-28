"use client";

import { useState } from "react";
import { createRoomType } from "@/lib/api-client";

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200";

export default function RoomTypeForm({ hotelId }: { hotelId: string }) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(2);
  const [baseRate, setBaseRate] = useState(0);
  const [amenities, setAmenities] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amenitiesList = amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      await createRoomType({
        hotel_id: hotelId,
        name,
        capacity,
        base_rate: baseRate,
        amenities: amenitiesList,
      });
      setSuccess(true);
      setName("");
      setCapacity(2);
      setBaseRate(0);
      setAmenities("");
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo crear el tipo de habitación. Verificá los datos e intentá de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <p
          role="status"
          className="text-green-600 bg-green-50 p-3 rounded dark:bg-green-900/30 dark:text-green-300"
        >
          ¡Tipo de habitación creado con éxito!
        </p>
      )}
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
          <label htmlFor="roomtype-name" className={labelClass}>
            Nombre
          </label>
          <input
            id="roomtype-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="roomtype-capacity" className={labelClass}>
            Capacidad
          </label>
          <input
            id="roomtype-capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            min={1}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="roomtype-rate" className={labelClass}>
            Tarifa base ($)
          </label>
          <input
            id="roomtype-rate"
            type="number"
            value={baseRate}
            onChange={(e) => setBaseRate(Number(e.target.value))}
            min={0}
            step={0.01}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="roomtype-amenities" className={labelClass}>
            Servicios (separados por comas)
          </label>
          <input
            id="roomtype-amenities"
            type="text"
            value={amenities}
            onChange={(e) => setAmenities(e.target.value)}
            placeholder="wifi, tv, aire acondicionado"
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Creando..." : "Crear tipo de habitación"}
      </button>
    </form>
  );
}
