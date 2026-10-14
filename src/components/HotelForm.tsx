"use client";

import { useEffect, useRef, useState } from "react";
import { createHotel } from "@/lib/api-client";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:border-white/10 dark:bg-brand-navy-900 dark:text-white dark:[color-scheme:dark]";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300";

const TIMEZONES = [
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Buenos_Aires",
  "America/Caracas",
  "America/Guayaquil",
  "America/La_Paz",
  "America/Asuncion",
  "America/Montevideo",
  "America/Mexico_City",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/Madrid",
  "Europe/London",
  "UTC",
];

export default function HotelForm() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("America/Bogota");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await createHotel({
        name,
        address: address.trim() || undefined,
        city,
        country,
        timezone,
        image_url: imageUrl.trim() || undefined,
      });
      setSuccess(true);
      setName("");
      setAddress("");
      setCity("");
      setCountry("");
      setTimezone("America/Bogota");
      setImageUrl("");
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el hotel. Verificá los datos e intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-brand-navy dark:text-white sm:text-3xl">
          Nuevo hotel
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Completá los datos de la propiedad para agregarla a la cadena.
        </p>
      </div>

      {success && (
        <div
          role="status"
          className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <svg className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">¡Hotel creado con éxito!</p>
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
              Ahora podés asignarle un manager desde la página de{" "}
              <a href="/admin/staff" className="underline hover:no-underline">Personal</a>.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
        >
          <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-brand-navy-800 space-y-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="hotel-name" className={labelClass}>
              Nombre del hotel <span className="text-red-500">*</span>
            </label>
            <input
              id="hotel-name"
              name="hotel-name"
              type="text"
              autoComplete="organization"
              placeholder="Ej.: Hotel Andino"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="hotel-address" className={labelClass}>
              Dirección
            </label>
            <input
              id="hotel-address"
              name="hotel-address"
              type="text"
              autoComplete="street-address"
              placeholder="Ej.: Av. Corrientes 1234"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="hotel-city" className={labelClass}>
              Ciudad <span className="text-red-500">*</span>
            </label>
            <input
              id="hotel-city"
              name="hotel-city"
              type="text"
              autoComplete="address-level2"
              placeholder="Ej.: Bogotá"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="hotel-country" className={labelClass}>
              País <span className="text-red-500">*</span>
            </label>
            <input
              id="hotel-country"
              name="hotel-country"
              type="text"
              autoComplete="country-name"
              placeholder="Ej.: Colombia"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="hotel-timezone" className={labelClass}>
              Zona horaria <span className="text-red-500">*</span>
            </label>
            <select
              id="hotel-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={inputClass}
              required
              style={{ colorScheme: "dark" }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Usada para calcular los turnos, check-in y check-out en hora local.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="hotel-image" className={labelClass}>
              Foto (URL)
            </label>
            <input
              id="hotel-image"
              name="hotel-image"
              type="url"
              placeholder="https://images.unsplash.com/…"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-navy px-5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-navy-900 active:scale-95 disabled:opacity-50 dark:bg-brand-gold dark:text-brand-navy dark:hover:bg-brand-gold-dark"
          >
            {loading ? "Creando…" : "Crear hotel"}
          </button>
          <a
            href="/admin/hotels"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
          >
            Cancelar
          </a>
        </div>
      </form>

      <div className="mt-4 rounded-2xl border border-brand-gold/20 bg-brand-gold/6 px-5 py-4 dark:bg-brand-gold/8">
        <p className="text-xs font-semibold text-brand-gold uppercase tracking-wider mb-1">Flujo recomendado</p>
        <ol className="mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-300 list-decimal list-inside">
          <li>Crear el hotel con esta pantalla.</li>
          <li>Ir a <a href="/admin/staff" className="text-brand-gold underline hover:no-underline">Personal</a> y crear el Manager asignándolo a este hotel.</li>
          <li>El Manager podrá luego crear recepcionistas y staff de limpieza.</li>
        </ol>
      </div>
    </div>
  );
}
