"use client";

import { useEffect } from "react";

const STORAGE_KEY = "hotelsync-warmed-up";

const HEALTH_URLS = [
  "/api/property/health",
  "/api/rate/health",
  "/api/booking/health",
  "/api/front-desk/health",
  "/api/housekeeping/health",
  "/api/billing/health",
];

/**
 * Despierta los backends en plan gratuito al entrar al sitio.
 * En Render free los servicios duermen (sleep) y el primer request tarda
 * ~60s en responder; disparar los 6 `/health` en paralelo al entrar hace
 * que estén calientes cuando el usuario navega. Fire-and-forget: no bloquea
 * el render, no muestra nada y los errores se ignoran (el timeout amable de
 * api-client cubre el caso de servicio todavía dormido).
 * Una sola vez por sesión (flag en sessionStorage).
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
      fetch(url, { signal: AbortSignal.timeout(10000) }).catch(() => {
        // Silencioso a propósito: es solo un despertador.
      });
    }
  }, []);

  return null;
}
