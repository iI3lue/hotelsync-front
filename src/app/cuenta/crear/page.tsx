import type { Metadata } from "next";
import CreateForm from "./form";

export const metadata: Metadata = {
  title: "Crear cuenta — HotelSync",
  description: "Creá tu cuenta de huésped gratis para gestionar tus reservas.",
};

export default function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  return <CreateForm params={searchParams} />;
}
