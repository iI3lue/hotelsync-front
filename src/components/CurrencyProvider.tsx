"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_CURRENCY,
  STATIC_COP_PER_UNIT,
  formatMoney,
  isCurrency,
  type Currency,
} from "@/lib/format";
import type { RatesPayload } from "@/lib/rates";

const STORAGE_KEY = "hotelsync-currency";
const POLL_INTERVAL_MS = 10 * 60 * 1000;

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatMoney: (amountCOP: number | string) => string;
  /** COP por unidad (en vivo cuando live=true, fallback si no). */
  rates: Record<Currency, number>;
  /** ISO de la cotización, null si es fallback. */
  updatedAt: string | null;
  /** false cuando las tasas son el fallback estático. */
  live: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
  formatMoney: (amountCOP) => formatMoney(amountCOP, DEFAULT_CURRENCY),
  rates: STATIC_COP_PER_UNIT,
  updatedAt: null,
  live: false,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Record<Currency, number>>(STATIC_COP_PER_UNIT);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  // Lee el stored solo en el cliente para no romper la hidratacion SSR
  // (el servidor siempre renderiza COP primero).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isCurrency(stored)) setCurrencyState(stored);
    } catch {
      // localStorage no disponible: se queda en COP.
    }
  }, []);

  // Cotización en vivo con polling: al montar, cada 10 minutos y al
  // volver a la pestaña. Si /api/rates falla, se conservan las últimas
  // tasas (o el fallback estático) y live queda en false.
  useEffect(() => {
    let cancelled = false;
    async function loadRates() {
      try {
        const res = await fetch("/api/rates", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<RatesPayload>;
        if (cancelled || !data.rates) return;
        setRates({ ...STATIC_COP_PER_UNIT, ...data.rates });
        setUpdatedAt(typeof data.updated_utc === "string" ? data.updated_utc : null);
        setLive(data.live === true);
      } catch {
        // Sin red: se queda con lo último conocido.
      }
    }
    void loadRates();
    const timer = setInterval(() => void loadRates(), POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadRates();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin persistencia igual funciona en la sesion.
    }
  }, []);

  const format = useCallback(
    (amountCOP: number | string) => formatMoney(amountCOP, currency, rates),
    [currency, rates]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, formatMoney: format, rates, updatedAt, live }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
