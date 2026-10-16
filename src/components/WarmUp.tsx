"use client";

import { useEffect } from "react";
import { timeoutSignal } from "@/lib/timeout-signal";

const STORAGE_KEY = "hotelsync-warmed-up";

// Un ping por cada servicio que consume el front vía rewrite. Los tres
// últimos (users, loyalty, payments) son los del flujo crítico — sesión,
// puntos y pago — y se agregaron después del rediseño.
const HEALTH_URLS = [
  "/api/property/health",
  "/api/rate/health",
  "/api/users/health",
  "/api/booking/health",
  "/api/front-desk/health",
  "/api/housekeeping/health",
  "/api/billing/health",
  "/api/loyalty/health",
  "/api/payments/health",
];

/**
 * Despierta los backends en plan gratuito al entrar al sitio.
 * En Render free los servicios duermen (sleep) y el primer request tarda
 * ~60s en responder; disparar los 9 `/health` en paralelo al entrar hace
 * que estén calientes cuando el usuario navega. Fire-and-forget: no bloquea
 * el render, no muestra nada y los errores se ignoran (el timeout amable de
 * api-client cubre el caso de servicio todavía dormido).
 * Una sola vez por sesión (flag en sessionStorage).
 *
 * Nota: un ping alcanza al servicio aunque su `/health` real viva en otro
 * path (el rewrite prepende `/v1`); lo que importa es la conexión entrante,
 * que es lo que despierta la instancia. Excepción conocida: loyalty necesita
 * `NEXT_PUBLIC_LOYALTY_API_URL` en Vercel o el rewrite cae a localhost.
 */
export default function WarmUp() {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY)) return;
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Sin sessionStorage igual se dispara una vez por montaje.
    }
    for (const url of HEALTH_URLS) {
      fetch(url, { signal: timeoutSignal(10000) }).catch(() => {
        // Silencioso a propósito: es solo un despertador.
      });
    }
  }, []);

  return null;
}
