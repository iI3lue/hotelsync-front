import type { Metadata } from "next";
import ResetForm from "./form";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  description: "Creá una contraseña nueva con tu enlace de recuperación.",
};

export default function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; code?: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-gold">
        Recuperar acceso
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-navy dark:text-white">
        Nueva contraseña
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Elegí una contraseña de al menos 8 caracteres.
      </p>
      <div className="mt-6">
        <ResetForm params={searchParams} />
      </div>
    </div>
  );
}
