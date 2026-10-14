// src/components/DangerZone.tsx
"use client";

import { useState } from "react";
import { deleteMe } from "@/lib/auth-client";
import Spinner from "@/components/Spinner";

export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = typed.trim().toUpperCase() === "ELIMINAR";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!confirmed) {
      setError("Escribí ELIMINAR para confirmar.");
      return;
    }
    setBusy(true);
    try {
      await deleteMe({
        ...(password ? { password } : {}),
        confirm: true,
      });
      // Recarga completa: las cookies ya se limpiaron en el servidor.
      window.location.href = "/";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar la cuenta"
      );
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-red-300 dark:border-red-800/50 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">
          Zona de peligro
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Eliminar tu cuenta cierra tu sesión, anonimiza tus datos y no se
          puede deshacer. Tu historial de reservas se conserva sin tus datos
          personales.
        </p>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800/50 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            Eliminar mi cuenta
          </button>
        )}
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-red-200 dark:border-red-800/40 p-6 space-y-4"
        >
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-300"
            >
              {error}
            </p>
          )}
          <div>
            <label htmlFor="danger-confirm" className="input-label">
              Escribí ELIMINAR para confirmar
            </label>
            <input
              id="danger-confirm"
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="ELIMINAR"
              autoComplete="off"
              className="input-field"
              required
            />
          </div>
          <div>
            <label htmlFor="danger-password" className="input-label">
              Contraseña actual
            </label>
            <input
              id="danger-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Si entrás con Google, dejala vacía"
              className="input-field"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
                setPassword("");
                setError(null);
              }}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || !confirmed}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? (
                <Spinner label="Eliminando…" />
              ) : (
                "Eliminar definitivamente"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
