"use client";

import { useCurrency } from "@/components/CurrencyProvider";
import { useToast } from "@/components/Toast";
import { isCurrency } from "@/lib/format";
import {
  CURRENCY_OPTIONS,
  CURRENCY_LABELS,
  currencyOptionLabel,
} from "@/lib/currency-labels";

/**
 * Preferencia de moneda de visualización dentro de Mi cuenta. Cambia sólo
 * cómo se muestran los precios (el cobro es en COP) y persiste en
 * localStorage a través de CurrencyProvider.
 */
export function CurrencySettings() {
  const { currency, setCurrency, rates, updatedAt, live } = useCurrency();
  const { success } = useToast();

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleString("es-CO", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "sin cotización aún";

  const rateLabel = live
    ? `Tasa en vivo · actualizada ${updatedLabel}`
    : "Sin conexión al proveedor · tasa de referencia";

  return (
    <div className="border border-brand-navy/10 bg-white dark:border-white/10 dark:bg-brand-navy-800">
      <div className="border-b border-brand-navy/10 p-6 dark:border-white/10">
        <h2 className="font-display text-[1.6rem] leading-tight text-brand-navy dark:text-white">
          Moneda
        </h2>
        <p className="text-sm text-brand-navy/55 dark:text-white/50">
          Cómo ves los precios en toda la web
        </p>
      </div>

      <div className="space-y-4 p-6">
        <div>
          <label htmlFor="currency-select" className="input-label">
            Moneda de visualización
          </label>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                live ? "bg-green-500" : "bg-amber-400"
              }`}
            />
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => {
                const next = e.target.value;
                if (!isCurrency(next) || next === currency) return;
                setCurrency(next);
                success(`Mostrando los precios en ${CURRENCY_LABELS[next]}`);
              }}
              aria-describedby="currency-help"
              className="input-field py-2"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {currencyOptionLabel(c, rates)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p id="currency-help" className="text-xs text-gray-400">
          Es sólo una referencia: la reserva se cobra siempre en pesos
          colombianos (COP). Se guarda en este dispositivo.
        </p>

        <p className="text-xs text-brand-navy/55 dark:text-white/50">
          {rateLabel}
        </p>
      </div>
    </div>
  );
}
