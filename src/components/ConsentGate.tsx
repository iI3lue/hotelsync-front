"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { acceptConsent, logout, me } from "@/lib/auth-client";
import { LEGAL_PATHS } from "@/lib/routes";

/**
 * Gate de consentimiento de datos: las cuentas GUEST sin
 * `terms_accepted_at` quedan bloqueadas por este modal hasta aceptar
 * (una sola vez). Cubre a los usuarios de Google —que no pasan por el
 * checkbox del registro— y a las cuentas creadas antes del campo.
 * El staff no se gatea.
 */
export default function ConsentGate() {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checked = useRef(false);
  const pathname = usePathname();
  const isLegal = LEGAL_PATHS.includes(pathname);

  useEffect(() => {
    if (isLegal || checked.current) return;
    checked.current = true;
    void me().then((profile) => {
      if (profile && profile.role === "GUEST" && !profile.terms_accepted_at) {
        setVisible(true);
      }
    });
  }, [isLegal]);

  useEffect(() => {
    if (!visible || isLegal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible, isLegal]);

  if (!visible || isLegal) return null;

  async function handleAccept() {
    setSubmitting(true);
    setError(null);
    try {
      await acceptConsent();
      setVisible(false);
    } catch {
      // El access pudo vencer: /api/auth/me rota la sesión en silencio.
      const profile = await me();
      if (profile) {
        try {
          await acceptConsent();
          setVisible(false);
          return;
        } catch {
          /* cae al mensaje de error */
        }
      }
      setError("No se pudo registrar la aceptación. Probá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-navy/60 px-4 backdrop-blur-sm"
    >
      <div className="animate-slide-up w-full max-w-md rounded-2.5xl border border-brand-navy/6 bg-white p-8 shadow-elevated dark:border-white/8 dark:bg-brand-navy-800">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/10">
          <svg
            className="h-6 w-6 text-brand-gold"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>

        <h2
          id="consent-title"
          className="font-display text-xl font-semibold tracking-tight text-brand-navy dark:text-white"
        >
          Tratamiento de datos personales
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Antes de continuar necesitamos tu autorización para tratar tus
          datos personales conforme a la Ley 1581, nuestros{" "}
          <a
            href="/terminos"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-brand-gold"
          >
            Términos de uso
          </a>{" "}
          y la{" "}
          <a
            href="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-brand-gold"
          >
            Política de privacidad
          </a>
          .
        </p>

        {error && (
          <div className="animate-notice-in mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-950/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={submitting}
            className="btn-primary w-full justify-center py-3 text-sm"
          >
            {submitting ? "Registrando…" : "Acepto y continúo"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={submitting}
            className="w-full py-2 text-center text-xs font-semibold text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
