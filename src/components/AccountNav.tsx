"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logout, me, type AuthProfile } from "@/lib/auth-client";

const linkClass =
  "text-sm font-medium text-gray-700 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-200 dark:hover:text-blue-400";

/**
 * Navegación de cuenta: muestra "Mi cuenta" sin sesión, o el email
 * con botón "Salir" cuando hay sesión. Sin esto el usuario logueado
 * no tenía forma de cerrar sesión desde el header.
 */
export default function AccountNav() {
  const router = useRouter();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void me().then((p) => {
      setProfile(p);
      setReady(true);
    });
  }, []);

  async function handleLogout() {
    await logout();
    setProfile(null);
    router.push("/");
    router.refresh();
  }

  if (!ready || !profile) {
    return (
      <a href="/cuenta/entrar" className={linkClass}>
        Mi cuenta
      </a>
    );
  }

  return (
    <span className="flex items-center gap-x-3">
      <span
        className="max-w-40 truncate text-sm text-gray-600 dark:text-gray-300"
        title={profile.email}
      >
        {profile.email}
      </span>
      <button type="button" onClick={() => void handleLogout()} className={linkClass}>
        Salir
      </button>
    </span>
  );
}
