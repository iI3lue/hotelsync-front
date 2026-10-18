"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GoogleButton from "@/components/GoogleButton";
import { me, register } from "@/lib/auth-client";
import AuthPanel from "@/components/ui/AuthPanel";

function safeReturnTo(value: string | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/mis-reservas";
}

/* ─── Password strength indicator ────────────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ["Muy débil", "Débil", "Regular", "Fuerte"];
  const colors = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : "bg-gray-200 dark:bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-400">{labels[score - 1] ?? "Muy débil"}</p>
    </div>
  );
}

/* ─── Left panel (ambient) ─────────────────────────────────── */
function RegisterAmbient() {
  return (
    <AuthPanel
      title="Tu próxima estancia empieza acá."
      points={["Historial de reservas en un solo lugar", "Check-in más ágil en recepción", "Puntos por cada estancia completada"]}
    />
  );
}

/* ─── Register form ──────────────────────────────────────────── */
export default function CreateForm({
  params,
}: {
  params: Promise<{ returnTo?: string }>;
}) {
  const router = useRouter();
  const [returnTo, setReturnTo] = useState("/mis-reservas");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => {
      setReturnTo(safeReturnTo(p.returnTo));
      void me().then((profile) => {
        if (profile) router.replace(safeReturnTo(p.returnTo));
      });
    });
  }, [params, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted) {
      setError("Debés aceptar el tratamiento de datos para crear tu cuenta.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        terms_accepted: true,
      });
      // Recarga completa: la UI monta de cero con la sesión nueva.
      window.location.href = returnTo;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear la cuenta. Revisá los datos."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] overflow-hidden">
      {/* Left ambient panel */}
      <div className="hidden lg:block lg:w-[42%] xl:w-[38%]">
        <RegisterAmbient />
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:px-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Header */}
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Empezá gratis
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-navy dark:text-white md:text-4xl">
              Creá tu cuenta
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              ¿Ya tenés cuenta?{" "}
              <a href="/cuenta/entrar" className="font-semibold text-brand-gold hover:underline">
                Entrar
              </a>
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2.5xl border border-brand-navy/6 bg-white p-8 shadow-card dark:border-white/6 dark:bg-brand-navy-800">
            {/* Google */}
            <GoogleButton returnTo={returnTo} />

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200 dark:border-white/8" />
              <span className="text-xs font-medium text-gray-400">o registrate con correo</span>
              <div className="flex-1 border-t border-gray-200 dark:border-white/8" />
            </div>

            {/* Error */}
            {error && (
              <div className="animate-notice-in mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-950/20">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="register-name" className="input-label">
                  Nombre y apellido
                </label>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Juan García"
                  className="input-field"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="register-email" className="input-label">
                  Correo electrónico
                </label>
                <input
                  id="register-email"
                  name="email"
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

              {/* Password */}
              <div>
                <label htmlFor="register-password" className="input-label">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className="input-field pr-20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-gray-400 hover:text-gray-600 focus-visible:outline-none dark:hover:text-gray-200"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Consent (obligatorio) */}
              <label
                htmlFor="register-terms"
                className="flex cursor-pointer items-start gap-2.5"
              >
                <input
                  id="register-terms"
                  name="terms_accepted"
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-brand-gold dark:border-white/20"
                />
                <span className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Acepto el tratamiento de mis datos personales conforme a los{" "}
                  <a
                    href="/terminos"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="underline hover:text-brand-gold"
                  >
                    Términos de uso
                  </a>{" "}
                  y la{" "}
                  <a
                    href="/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="underline hover:text-brand-gold"
                  >
                    Política de privacidad
                  </a>
                  .
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !accepted}
                className="btn-primary w-full justify-center py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creando cuenta…
                  </span>
                ) : "Crear mi cuenta gratis"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
