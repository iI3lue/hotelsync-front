"use client";

import { useState } from "react";
import { requestCode } from "@/lib/auth-client";
import Spinner from "@/components/Spinner";

export default function RecoverForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const result = await requestCode(email.trim());
      setCode(result.code ?? null);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo enviar el código"
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-green-200 bg-green-50 p-6 text-sm text-green-800 dark:border-green-800/40 dark:bg-green-950/20 dark:text-green-300"
      >
        {code ? (
          <>
            <p className="font-semibold">Tu código de recuperación:</p>
            <p
              aria-label={`Código ${code}`}
              className="my-3 text-center font-mono text-4xl font-bold tracking-[0.3em]"
            >
              {code}
            </p>
            <p>
              Vale por 10 minutos. Ingresalo en la pantalla de restablecer
              junto a tu contraseña nueva.
            </p>
            <a
              href={`/cuenta/restablecer?code=${code}`}
              className="btn-primary mt-4 flex w-full justify-center"
            >
              Continuar
            </a>
          </>
        ) : (
          <>
            <p className="font-semibold">Revisá tu correo.</p>
            <p className="mt-1">
              Si la cuenta existe, vas a recibir un código válido por 10
              minutos para crear una contraseña nueva.
            </p>
            <a
              href="/cuenta/entrar"
              className="mt-4 inline-block font-semibold text-brand-gold hover:underline"
            >
              Volver a entrar
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-card dark:border-white/10 dark:bg-brand-navy-800">
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-300"
        >
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="recover-email" className="input-label">
            Correo electrónico
          </label>
          <input
            id="recover-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            spellCheck={false}
            placeholder="vos@ejemplo.com"
            className="input-field"
            required
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="btn-primary w-full justify-center"
        >
          {sending ? <Spinner label="Enviando…" /> : "Enviar código"}
        </button>
      </form>
    </div>
  );
}
