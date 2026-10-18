import type { Metadata } from "next";
import MyBookings from "./my-bookings";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Mis reservas",
  description: "Tus reservas asociadas a tu cuenta o tu correo.",
};

export default function MyBookingsPage() {
  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Mis reservas" }]}
        eyebrow="Tu cuenta"
        title="Mis reservas"
        lead="El estado y las fechas de tus estancias, incluidas las pagadas, hasta el día de salida."
      />
      <div className="shell">
        <MyBookings />
      </div>
    </div>
  );
}
