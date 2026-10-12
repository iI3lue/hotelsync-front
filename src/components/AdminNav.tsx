"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { me } from "@/lib/auth-client";
import AdminAuthLink from "@/components/AdminAuthLink";
import { adminSectionsFor, useViewAs } from "@/lib/view-as";

const linkClass =
  "rounded px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-200 dark:hover:text-blue-400";

/**
 * Navegación del admin filtrada por la vista simulada ("Ver como…").
 * Solo renderizado: si el rol real no es SUPER_ADMIN se muestra todo
 * como antes (zona académica sin gating real).
 */
export default function AdminNav() {
  const pathname = usePathname();
  const [realRole, setRealRole] = useState<string | null>(null);
  const { viewedRole } = useViewAs(realRole);

  useEffect(() => {
    void me().then((p) => setRealRole(p?.role ?? null));
  }, []);

  const sections =
    realRole === "SUPER_ADMIN"
      ? adminSectionsFor(viewedRole)
      : adminSectionsFor("SUPER_ADMIN");

  return (
    <nav
      aria-label="Administración"
      className="mb-6 flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800"
    >
      <span className="mr-1 rounded bg-gray-800 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white dark:bg-gray-950">
        Admin
      </span>
      {sections.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-current={pathname === s.href ? "page" : undefined}
          className={`${linkClass} ${
            pathname === s.href ? "bg-gray-100 dark:bg-white/10" : ""
          }`}
        >
          {s.label}
        </Link>
      ))}
      {sections.length === 0 && (
        <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
          Vista de invitado: sin secciones administrativas.{" "}
          <Link href="/" className="font-semibold underline">
            Volver al sitio
          </Link>
        </span>
      )}
      <a href="/" className={linkClass}>
        ← Volver al sitio
      </a>
      <AdminAuthLink linkClass={linkClass} />
    </nav>
  );
}
