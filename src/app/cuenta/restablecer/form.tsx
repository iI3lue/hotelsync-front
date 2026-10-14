"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resetPassword } from "@/lib/auth-client";
import Spinner from "@/components/Spinner";

export default function ResetForm({
  params,
}: {
  params: Promise<{ token?: string; code?: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void params.then((p) => {
      // El enlace (?token=) o el botón continuar (?code=) lo precargan;
      // igual queda editable por si el usuario lo tiene a mano.
      setCode(p.token ?? p.code ?? "");
      setReady(true);
    });
  }, [params]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const value = code.trim();
    if (value.length < 6) {
      setError("Ingresá el código de 6 dígitos que recibiste.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña necesita al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      await resetPassword(value, password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo restablecer la contraseña"
      );
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Cargando…" />
      </div>
    );
  }

  if (done) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-green-200 bg-green-50 p-6 text-sm text-green-800 dark:border-green-800/40 dark:bg-green-950/20 dark:text-green-300"
      >
        <p className="font-semibold">Contraseña actualizada.</p>
        <p className="mt-1">
          Ya podés entrar con tu contraseña nueva. Por seguridad se cerraron
          tus otras sesiones.
        </p>
        <button
          type="button"
          onClick={() => router.push("/cuenta/entrar")}
          className="btn-primary mt-4 w-full justify-center"
        >
          Entrar a mi cuenta
        </button>
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
          <label htmlFor="reset-code" className="input-label">
            Código de recuperación
          </label>
          <input
            id="reset-code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6 dígitos"
            maxLength={256}
            autoComplete="one-time-code"
            className="input-field font-mono tracking-[0.3em] text-center text-xl"
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            Vale 10 minutos. Si no lo tenés,{" "}
            <a
              href="/cuenta/recuperar"
              className="font-semibold text-brand-gold hover:underline"
            >
              pedí uno nuevo
            </a>
            .
          </p>
        </div>
        <div>
          <label htmlFor="reset-password" className="input-label">
            Contraseña nueva
          </label>
          <input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            className="input-field"
            required
          />
        </div>
        <div>
          <label htmlFor="reset-confirm" className="input-label">
            Repetir contraseña
          </label>
          <input
            id="reset-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="input-field"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full justify-center"
        >
          {saving ? <Spinner label="Guardando…" /> : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
