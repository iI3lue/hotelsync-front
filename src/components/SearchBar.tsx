"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DatePickerButton from "@/components/DatePickerButton";

interface SearchBarProps {
  initialCity?: string;
  initialFrom?: string;
  initialTo?: string;
  initialGuests?: string;
}

const fieldClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 touch-manipulation dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200";

export default function SearchBar({
  initialCity = "",
  initialFrom = "",
  initialTo = "",
  initialGuests = "2",
}: SearchBarProps) {
  const router = useRouter();
  const [city, setCity] = useState(initialCity);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [guests, setGuests] = useState(initialGuests);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (guests) params.set("guests", guests);
    const query = params.toString();
    router.push(query ? `/buscar?${query}` : "/buscar");
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Buscar hoteles"
      className="grid grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
    >
      <div className="min-w-0">
        <label htmlFor="search-city" className={labelClass}>
          Destino
        </label>
        <input
          id="search-city"
          name="city"
          type="search"
          autoComplete="address-level2"
          spellCheck={false}
          placeholder="Ej.: Bogotá, Medellín, Cartagena…"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={fieldClass}
        />
      </div>
      <DatePickerButton
        label="Llegada"
        id="search-from"
        value={from}
        onChange={(iso) => {
          setFrom(iso);
          if (to && to <= iso) setTo("");
        }}
      />
      <DatePickerButton
        label="Salida"
        id="search-to"
        value={to}
        minDate={from || undefined}
        onChange={setTo}
      />
      <div className="min-w-0">
        <label htmlFor="search-guests" className={labelClass}>
          Huéspedes
        </label>
        <input
          id="search-guests"
          name="guests"
          type="number"
          inputMode="numeric"
          min={1}
          max={10}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          onBlur={() => {
            const n = Number(guests);
            if (!Number.isFinite(n) || n < 1) setGuests("1");
            else if (n > 10) setGuests("10");
          }}
          className={`${fieldClass} tabular-nums`}
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          className="w-full rounded bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation md:w-auto dark:focus-visible:ring-offset-gray-800"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
