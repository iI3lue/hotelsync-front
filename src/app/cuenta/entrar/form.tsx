"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GoogleButton from "@/components/GoogleButton";
import { login, me } from "@/lib/auth-client";

const inputClass =
  "w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200";

function safeReturnTo(value: string | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/mis-reservas";
}

export default function EnterForm({
  params,
}: {
  params: Promise<{ returnTo?: string; error?: string }>;
}) {
  const router = useRouter();
  const [returnTo, setReturnTo] = useState("/mis-reservas");
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => {
      setReturnTo(safeReturnTo(p.returnTo));
      if (p.error === "oauth") {
        setOauthError("No se pudo completar el acceso con Google. Probá de nuevo o usá tu correo.");
      } else if (p.error === "linked") {
        setOauthError(
          "Ese correo ya tiene cuenta con contraseña. Entrá con tu correo y contraseña."
        );
      }
      void me().then((profile) => {
        if (profile) router.replace(safeReturnTo(p.returnTo));
      });
    });
  }, [params, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.push(returnTo);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar sesión. Revisá las credenciales."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-3xl font-bold">Entrar a tu cuenta</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
        Gestioná tus reservas y reservá más rápido.{" "}
        <a href="/cuenta/crear" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Crear cuenta
        </a>
      </p>

      {oauthError ? (
        <p role="alert" className="mb-4 rounded bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {oauthError}
        </p>
      ) : null}

      <div className="space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <GoogleButton returnTo={returnTo} />
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <p role="alert" className="rounded bg-red-50 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <div>
            <label htmlFor="account-email" className={labelClass}>
              Correo
            </label>
            <input
              id="account-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              spellCheck={false}
              placeholder="vos@ejemplo.com…"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="account-password" className={labelClass}>
              Contraseña
            </label>
            <div className="relative">
              <input
                id="account-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className={`${inputClass} pr-20`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:text-white"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Ingresando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
