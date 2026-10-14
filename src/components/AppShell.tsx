"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { me } from "@/lib/auth-client";
import { adminSectionsFor, useViewAs, type ViewAsRole } from "@/lib/view-as";
import { ROUTES } from "@/lib/routes";

const linkClass =
  "rounded-xl px-3.5 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold";

export default function AppShell() {
  const pathname = usePathname();
  const [realRole, setRealRole] = useState<string | null>(null);
  const { viewedRole } = useViewAs(realRole);

  useEffect(() => {
    void me().then((p) => setRealRole(p?.role ?? null));
  }, []);

  const sections = adminSectionsFor(viewedRole);
  const showGuestLink = viewedRole === "MANAGER" || viewedRole === "SUPER_ADMIN";

  return (
    <nav
      aria-label="Administración"
      className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white/80 p-2.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-brand-navy-800/80"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {sections.map((s) => {
          const active = pathname === s.href;
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={active ? "page" : undefined}
              className={`${linkClass} ${
                active
                  ? "bg-brand-gold/15 font-semibold text-brand-navy shadow-xs dark:bg-brand-gold/20 dark:text-brand-gold"
                  : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              {s.label}
            </Link>
          );
        })}

        {sections.length === 0 && (
          <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
            Vista de invitado: sin secciones administrativas.{" "}
            <Link href="/" className="font-semibold text-brand-gold underline">
              Volver al sitio
            </Link>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showGuestLink && (
          <Link
            href={ROUTES.home}
            className={`${linkClass} text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white`}
          >
            ← Vista huésped
          </Link>
        )}
      </div>
    </nav>
  );
}
