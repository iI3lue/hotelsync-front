import type { Metadata } from "next";
import ProfileForm from "./form";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { CurrencySettings } from "@/components/account/CurrencySettings";
import { DangerZone } from "@/components/DangerZone";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Tus datos de cuenta: nombre, correo, foto y teléfono.",
};

export default function ProfilePage() {
  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Mi perfil" }]}
        eyebrow="Tu cuenta"
        title="Mi perfil"
        lead="Los datos con los que el hotel te identifica y tu nivel de fidelización."
      />
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-8">
          <LoyaltyCard />
          <CurrencySettings />
        </div>
        <div className="space-y-10">
          <ProfileForm />
          <DangerZone />
        </div>
      </div>
    </div>
  );
}
