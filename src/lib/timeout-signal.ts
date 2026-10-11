/**
 * Señal de timeout compatible con iPhones viejos.
 *
 * `AbortSignal.timeout()` es Baseline 2024 y NO existe en Safari < 17:
 * llamarlo directo revienta con TypeError y deja sin red a todo el que
 * lo use (fetchWithSession, WarmUp, etc.). Este helper usa el nativo
 * cuando está y cae a AbortController + setTimeout cuando no.
 *
 * Módulo plano (sin "use client"): se importa desde Client Components
 * y desde route handlers sin romper el bundle.
 */

export function timeoutSignal(ms: number): AbortSignal {
  if (
    typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function"
  ) {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => {
    try {
      controller.abort(
        new DOMException(`Timeout of ${ms}ms exceeded`, "TimeoutError")
      );
    } catch {
      controller.abort();
    }
  }, ms);
  // Si el caller aborta por su cuenta, no dejar el timer colgado
  // (en iOS viejo cada timer vivo es memoria y wakeups de más).
  controller.signal.addEventListener("abort", () => clearTimeout(timer), {
    once: true,
  });
  return controller.signal;
}

/** El fallo es por red/timeout y vale reintentar (no un HTTP real). */
export function isRetryableError(err: unknown): boolean {
  // fetch ante corte de red / DNS / wifi inestable.
  if (err instanceof TypeError) return true;
  if (err instanceof DOMException) {
    // TimeoutError del helper o del nativo; AbortError es cancelación
    // voluntaria (navegación, StrictMode) y NO se reintenta.
    return err.name === "TimeoutError";
  }
  return false;
}

/** Espera con jitter para no sincronizar reintentos en red mala. */
export function backoffDelay(attempt: number): number {
  const base = 400 * 2 ** attempt;
  return base + Math.floor(Math.random() * 200);
}
