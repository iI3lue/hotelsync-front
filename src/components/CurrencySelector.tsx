"use client";

import { CURRENCIES, isCurrency } from "@/lib/format";
import { useCurrency } from "@/components/CurrencyProvider";

const LABELS: Record<string, string> = {
  COP: "COP $",
  USD: "USD $",
  EUR: "EUR €",
  MXN: "MXN $",
  BRL: "BRL R$",
  CLP: "CLP $",
  PEN: "PEN S/",
  ARS: "ARS $",
};

function compactRate(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: value < 10 ? 2 : 0,
  }).format(value);
}

/**
 * Selector de moneda del header. Cambia solo la visualización de precios
 * (el backend cobra en COP); la elección persiste en localStorage.
 * Cada opción muestra su tasa viva (COP por unidad) y el punto indica
 * si la cotización es en vivo o fallback.
 */
export default function CurrencySelector() {
  const { currency, setCurrency, rates, updatedAt, live } = useCurrency();

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleString("es-CO", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "sin cotización aún";
  const title = live
    ? `Tasa en vivo, actualizada: ${updatedLabel} (el cobro es en COP)`
    : `Sin conexión al proveedor: tasa de referencia (el cobro es en COP)`;

  return (
    <label className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
      <span className="sr-only">Moneda de visualización</span>
      <span
        aria-hidden
        title={title}
        className={`inline-block h-2 w-2 rounded-full ${live ? "bg-green-500" : "bg-amber-400"}`}
      />
      <select
        value={currency}
        onChange={(e) => {
          if (isCurrency(e.target.value)) setCurrency(e.target.value);
        }}
        aria-label="Moneda de visualización"
        title={title}
        className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-900"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c === "COP"
              ? LABELS[c]
              : `${LABELS[c]} — ${compactRate(rates[c])}`}
          </option>
        ))}
      </select>
    </label>
  );
}
