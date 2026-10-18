"use client";

import { useEffect } from "react";
import { timeoutSignal } from "@/lib/timeout-signal";

const STORAGE_KEY = "hotelsync-warmed-up";

/**
 * Despierta los backends en plan gratuito al entrar al sitio.
 * En Render free los servicios duermen y el primer request tarda ~60s;
 * un único request a /api/warmup dispara los 11 `/health` en paralelo
 * desde el servidor, sin CORS y sin bloquear el render.
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
    fetch("/api/warmup", {
      cache: "no-store",
      signal: timeoutSignal(15000),
    }).catch(() => {
      // Silencioso a propósito: es solo un despertador.
    });
  }, []);

  return null;
}
