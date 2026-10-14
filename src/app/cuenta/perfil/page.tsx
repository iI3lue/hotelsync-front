import type { Metadata } from "next";
import ProfileForm from "./form";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { DangerZone } from "@/components/DangerZone";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Tus datos de cuenta: nombre, correo, foto y teléfono.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-brand-navy dark:text-white">
          Mi perfil
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Estos son los datos con los que el hotel te identifica y tu nivel de fidelización.
        </p>
      </div>

      {/* Tarjeta de Fidelización */}
      <LoyaltyCard />

      {/* Datos Personales */}
      <div className="mt-6">
        <ProfileForm />
      </div>

      {/* Baja de cuenta */}
      <DangerZone />
    </div>
  );
}