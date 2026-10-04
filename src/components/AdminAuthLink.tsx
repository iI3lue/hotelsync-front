"use client";

import { useEffect, useState } from "react";
import { logout, me, type AuthProfile } from "@/lib/auth-client";

export default function AdminAuthLink({ linkClass }: { linkClass: string }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  useEffect(() => {
    void me().then(setProfile);
  }, []);

  if (!profile) {
    return (
      <a href="/admin/login" className={`${linkClass} ml-auto`}>
        Acceder
      </a>
    );
  }

  return (
    <span className="ml-auto flex items-center gap-2">
      <span className="max-w-44 truncate text-sm text-gray-600 dark:text-gray-300">
        {profile.email} · {profile.role}
      </span>
      <button
        type="button"
        onClick={() => {
          void logout().then(() => {
            setProfile(null);
            window.location.href = "/admin/login";
          });
        }}
        className={linkClass}
      >
        Salir
      </button>
    </span>
  );
}
