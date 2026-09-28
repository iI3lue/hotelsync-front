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
  formatMoney,
  isCurrency,
  type Currency,
} from "@/lib/format";

const STORAGE_KEY = "hotelsync-currency";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatMoney: (amountCOP: number | string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
  formatMoney: (amountCOP) => formatMoney(amountCOP, DEFAULT_CURRENCY),
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);

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

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin persistencia igual funciona en la sesion.
    }
  }, []);

  const format = useCallback(
    (amountCOP: number | string) => formatMoney(amountCOP, currency),
    [currency]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, formatMoney: format }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
