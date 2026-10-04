"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/auth-client";

const inputClass =
  "w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.push("/admin");
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
      <h1 className="mb-2 text-3xl font-bold">Acceder</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
        El personal usa su cuenta de HotelSync. Sin sesión, las lecturas siguen
        abiertas pero las altas protegidas devuelven 401.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800"
      >
        {error && (
          <p
            role="alert"
            className="rounded bg-red-50 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <div>
          <label htmlFor="login-email" className={labelClass}>
            Correo
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="login-password" className={labelClass}>
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className={inputClass}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
