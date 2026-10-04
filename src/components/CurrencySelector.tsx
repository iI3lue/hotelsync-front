"use client";

import { CURRENCIES, type Currency } from "@/lib/format";
import { useCurrency } from "@/components/CurrencyProvider";

const LABELS: Record<Currency, string> = {
  COP: "COP $",
  USD: "USD",
  EUR: "EUR €",
};

/**
 * Selector de moneda del header. Cambia solo la visualizacion de precios
 * (el backend cobra en COP); la eleccion persiste en localStorage.
 */
export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <label className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
      <span className="sr-only">Moneda de visualización</span>
      <select
        value={currency}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "COP" || next === "USD" || next === "EUR") {
            setCurrency(next);
          }
        }}
        aria-label="Moneda de visualización"
        title="Moneda de visualización (el cobro es en COP)"
        className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-900"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {LABELS[c]}
          </option>
        ))}
      </select>
    </label>
  );
}
