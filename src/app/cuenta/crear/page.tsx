import type { Metadata } from "next";
import { auth0Config } from "@/lib/auth-session";
import CreateForm from "./form";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Creá tu cuenta de huésped gratis para gestionar tus reservas.",
};

export default function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  return <CreateForm params={searchParams} googleEnabled={auth0Config() !== null} />;
}
