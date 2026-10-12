"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GoogleButton from "@/components/GoogleButton";
import { useToast } from "@/components/Toast";
import { login, me } from "@/lib/auth-client";

function safeReturnTo(value: string | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/mis-reservas";
}

function postLoginDest(profile: { role: string }, returnTo: string): string {
  if (profile.role !== "GUEST" && returnTo === "/mis-reservas") return "/admin";
  return returnTo;
}

/* ─── Left panel (ambient) ─────────────────────────────────── */
function AuthAmbient({ mode }: { mode: "login" | "register" }) {
  const quotes = [
    { text: "El lujo es el arte de no necesitar nada más.", author: "Coco Chanel" },
    { text: "Viajar es la única cosa que comprás que te hace más rico.", author: "Anónimo" },
    { text: "No existen países extraños; solo somos extranjeros nosotros.", author: "R. L. Stevenson" },
  ];
  const q = quotes[mode === "login" ? 0 : 1];

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-hero-gradient p-10">
      {/* Orb decorations */}
      <div aria-hidden="true" className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-gold/8 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Logo */}
      <div className="relative">
        <a href="/" className="font-display text-2xl font-semibold text-white">
          Hotel<span className="text-brand-gold">Sync</span>
        </a>
      </div>

      {/* Center content */}
      <div className="relative space-y-6">
        {/* Decorative mini hotel card */}
        <div className="w-72 rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
          <div className="mb-3 h-28 w-full rounded-xl bg-gradient-to-br from-brand-gold/20 to-blue-800/40" />
          <div className="space-y-2">
            <div className="h-3 w-3/4 rounded-full bg-white/20" />
            <div className="h-2.5 w-1/2 rounded-full bg-white/12" />
            <div className="mt-3 flex items-center justify-between">
              <div className="h-2.5 w-16 rounded-full bg-brand-gold/40" />
              <div className="h-7 w-20 rounded-lg bg-brand-gold/30" />
            </div>
          </div>
        </div>

        <blockquote>
          <p className="text-lg font-medium leading-snug text-white/90">
            &ldquo;{q.text}&rdquo;
          </p>
          <footer className="mt-2 text-sm text-blue-200/60">— {q.author}</footer>
        </blockquote>
      </div>

      {/* Bottom features */}
      <div className="relative space-y-3">
        {[
          "Confirmación de reserva instantánea",
          "Control de disponibilidad en tiempo real",
          "Historial completo de estadías",
        ].map((f) => (
          <div key={f} className="flex items-center gap-2.5 text-sm text-blue-100/70">
            <svg className="h-4 w-4 shrink-0 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Login form ────────────────────────────────────────────── */
export default function EnterForm({
  params,
}: {
  params: Promise<{ returnTo?: string; error?: string }>;
}) {
  const router = useRouter();
  const { success } = useToast();
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
        setOauthError("Ese correo ya tiene cuenta con contraseña. Entrá con tu correo y contraseña.");
      }
      void me().then((profile) => {
        if (profile) router.replace(postLoginDest(profile, safeReturnTo(p.returnTo)));
      });
    });
  }, [params, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const profile = await login(email.trim(), password);
      success("Inicio de sesión exitoso", profile.email);
      router.push(postLoginDest(profile, returnTo));
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
    <div className="flex min-h-[calc(100vh-72px)] overflow-hidden">
      {/* Left ambient panel */}
      <div className="hidden lg:block lg:w-[42%] xl:w-[38%]">
        <AuthAmbient mode="login" />
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:px-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Header */}
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Bienvenido de vuelta
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-navy dark:text-white md:text-4xl">
              Entrá a tu cuenta
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              ¿No tenés cuenta?{" "}
              <a href="/cuenta/crear" className="font-semibold text-brand-gold hover:underline">
                Crear cuenta gratis
              </a>
            </p>
          </div>

          {/* OAuth error */}
          {oauthError && (
            <div className="animate-notice-in mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-amber-800 dark:text-amber-200">{oauthError}</p>
            </div>
          )}

          {/* Card */}
          <div className="rounded-2.5xl border border-brand-navy/6 bg-white p-8 shadow-card dark:border-white/6 dark:bg-brand-navy-800">
            {/* Google */}
            <GoogleButton returnTo={returnTo} />

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200 dark:border-white/8" />
              <span className="text-xs font-medium text-gray-400">o continuá con tu correo</span>
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
              {/* Email */}
              <div>
                <label htmlFor="account-email" className="input-label">
                  Correo electrónico
                </label>
                <input
                  id="account-email"
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
                <label htmlFor="account-password" className="input-label">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="account-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
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
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando…
                  </span>
                ) : "Entrar a mi cuenta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
