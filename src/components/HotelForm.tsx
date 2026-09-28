"use client";

import { useEffect, useRef, useState } from "react";
import { createHotel } from "@/lib/api-client";

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200";

export default function HotelForm() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createHotel({ name, city, country, timezone });
      setSuccess(true);
      setName("");
      setCity("");
      setCountry("");
      setTimezone("");
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el hotel. Verificá los datos e intentá de nuevo.");
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
          ¡Hotel creado con éxito!
        </p>
      )}
      {error && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded bg-red-50 p-3 text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:bg-red-900/30 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="hotel-name" className={labelClass}>
            Nombre
          </label>
          <input
            id="hotel-name"
            name="hotel-name"
            type="text"
            autoComplete="organization"
            placeholder="Ej.: Hotel Andino…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="hotel-city" className={labelClass}>
            Ciudad
          </label>
          <input
            id="hotel-city"
            name="hotel-city"
            type="text"
            autoComplete="address-level2"
            placeholder="Ej.: Bogotá…"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="hotel-country" className={labelClass}>
            País
          </label>
          <input
            id="hotel-country"
            name="hotel-country"
            type="text"
            autoComplete="country-name"
            placeholder="Ej.: Colombia…"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="hotel-timezone" className={labelClass}>
            Zona horaria
          </label>
          <input
            id="hotel-timezone"
            name="hotel-timezone"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="America/Bogota…"
            className={inputClass}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50"
      >
        {loading ? "Creando…" : "Crear hotel"}
      </button>
    </form>
  );
}
