import type { Metadata } from "next";
import RecoverForm from "./form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Pedí un enlace para restablecer tu contraseña.",
};

export default function RecoverPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-gold">
        Recuperar acceso
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-navy dark:text-white">
        ¿Olvidaste tu contraseña?
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Ingresá tu correo y te enviamos un enlace para crear una nueva.
      </p>
      <div className="mt-6">
        <RecoverForm />
      </div>
    </div>
  );
}
