import type { Metadata } from "next";
import { auth0Config } from "@/lib/auth-session";
import EnterForm from "./form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Accedé a tu cuenta de huésped o creá una nueva.",
};

export default function EnterPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  return <EnterForm params={searchParams} googleEnabled={auth0Config() !== null} />;
}
