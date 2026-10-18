"use client";

import { useEffect, useRef, useState } from "react";
import { getBookingPoints, getMyLoyalty } from "./api-loyalty";

export interface BookingPointsState {
  status: "polling" | "settled" | "timeout";
  /** Puntos acreditados (settled) — null mientras se espera. */
  points: number | null;
  /** Nivel vigente después de la acreditación. */
  tier: string | null;
  /** Nivel previo al pago (para proyectar si la acreditación tarda). */
  baseTier: string | null;
  /** true si la reserva ya fue cancelada y sus puntos revertidos. */
  reversed: boolean;
}

const RETRY_DELAYS_MS = [1000, 1500, 2000, 2500, 3000]; // ~10s en total

/**
 * Sondea la acreditación de puntos de una reserva recién pagada.
 * La acreditación viaja por eventos (payment.completed → outbox → RabbitMQ),
 * así que normalmente tarda uno o dos segundos; si no llega, el UI usa la
 * proyección con `baseTier` en vez de quedarse colgado.
 */
export function useBookingPoints(
  bookingId: string | null,
  active: boolean
): BookingPointsState {
  const [state, setState] = useState<BookingPointsState>({
    status: "polling",
    points: null,
    tier: null,
    baseTier: null,
    reversed: false,
  });
  const settledRef = useRef(false);

  useEffect(() => {
    if (!active || !bookingId) return;
    let cancelled = false;
    settledRef.current = false;
    setState({ status: "polling", points: null, tier: null, baseTier: null, reversed: false });

    void (async () => {
      let baseTier: string | null = null;
      try {
        baseTier = (await getMyLoyalty()).account.tier;
      } catch {
        /* sin sesión o servicio caído: la proyección cae a silver */
      }
      if (cancelled) return;
      setState((s) => ({ ...s, baseTier }));

      for (let attempt = 0; ; attempt++) {
        try {
          const res = await getBookingPoints(bookingId);
          if (cancelled) return;
          if (res?.earn) {
            let tier = baseTier;
            try {
              tier = (await getMyLoyalty()).account.tier;
            } catch {
              /* mejor baseTier que nada */
            }
            if (cancelled) return;
            settledRef.current = true;
            setState({
              status: "settled",
              points: res.reverse ? res.reverse.points : res.earn.points,
              tier,
              baseTier,
              reversed: Boolean(res.reverse),
            });
            return;
          }
        } catch {
          /* reintentar hasta agotar el presupuesto */
        }

        const delay = RETRY_DELAYS_MS[attempt];
        if (cancelled) return;
        if (delay === undefined) {
          setState((s) => (settledRef.current ? s : { ...s, status: "timeout" }));
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (cancelled) return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId, active]);

  return state;
}
