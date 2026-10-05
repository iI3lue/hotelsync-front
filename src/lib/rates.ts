import {
  CURRENCIES,
  STATIC_COP_PER_UNIT,
  type Currency,
} from "@/lib/format";

export type { Currency };

export interface RatesPayload {
  base: "COP";
  /** COP por unidad de cada moneda (ARS = tasa oficial). */
  rates: Record<Currency, number>;
  /** ISO de la cotización del proveedor, o null si es fallback. */
  updated_utc: string | null;
  /** false cuando viene del fallback estático (proveedor caído). */
  live: boolean;
}

/**
 * Totales de símbolos que pedimos al proveedor (sin COP, que es la base).
 */
export const RATE_SYMBOLS = CURRENCIES.filter((c) => c !== "COP");

/**
 * Parsea la respuesta de open.er-api.com (`/v6/latest/COP`) a COP-por-unidad.
 * er-api devuelve unidades de la moneda por 1 COP (p. ej. USD: 0.00024);
 * las invertimos para nuestro formato (COP por 1 USD). Lanza si el payload
 * no trae tasas utilizables: el llamador decide el fallback.
 */
export function parseErApiResponse(json: unknown): {
  rates: Record<Currency, number>;
  updatedUtc: string | null;
} {
  const obj = (json ?? {}) as {
    result?: string;
    base_code?: string;
    time_last_update_utc?: string;
    rates?: Record<string, number>;
  };
  if (obj.result !== "success" || obj.base_code !== "COP") {
    throw new Error("Unexpected rates provider response");
  }
  const raw = obj.rates ?? {};
  const rates = { ...STATIC_COP_PER_UNIT };
  for (const symbol of RATE_SYMBOLS) {
    const perCop = raw[symbol];
    if (typeof perCop === "number" && perCop > 0) {
      rates[symbol] = 1 / perCop;
    }
  }
  return {
    rates,
    updatedUtc:
      typeof obj.time_last_update_utc === "string"
        ? obj.time_last_update_utc
        : null,
  };
}

/** Respuesta de fallback: tasas estáticas marcadas como no-vivas. */
export function fallbackPayload(): RatesPayload {
  return {
    base: "COP",
    rates: { ...STATIC_COP_PER_UNIT },
    updated_utc: null,
    live: false,
  };
}
