import { CURRENCIES, type Currency } from "./format";

/**
 * Etiquetas de moneda y formateo de su tasa (COP por unidad). Puro y sin
 * React: lo consumen el selector de Mi cuenta y cualquier otra superficie
 * que muestre la lista de monedas.
 */
export const CURRENCY_LABELS: Record<Currency, string> = {
  COP: "COP $",
  USD: "USD $",
  EUR: "EUR €",
  MXN: "MXN $",
  BRL: "BRL R$",
  CLP: "CLP $",
  PEN: "PEN S/",
  ARS: "ARS $",
};

/** Tasa compacta para las opciones del select (2 decimales sólo bajo 10). */
export function compactRate(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: value < 10 ? 2 : 0,
  }).format(value);
}

/** Etiqueta de una opción: COP no muestra tasa (es la base). */
export function currencyOptionLabel(
  currency: Currency,
  rates: Record<Currency, number>
): string {
  const label = CURRENCY_LABELS[currency];
  return currency === "COP" ? label : `${label} — ${compactRate(rates[currency])}`;
}

/** Monedas seleccionables, en orden canónico. */
export const CURRENCY_OPTIONS: readonly Currency[] = CURRENCIES;
