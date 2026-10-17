"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultRouteForRole, isAllowedPathForRole } from "@/lib/routes";

export { defaultRouteForRole, isAllowedPathForRole };

/** Roles simulables en el selector "Ver como…". */
export const VIEW_AS_ROLES = [
  "SUPER_ADMIN",
  "MANAGER",
  "RECEPTIONIST",
  "HOUSEKEEPER",
  "GUEST",
] as const;

export type ViewAsRole = (typeof VIEW_AS_ROLES)[number];

export const VIEW_AS_LABELS: Record<ViewAsRole, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  RECEPTIONIST: "Recepcionista",
  HOUSEKEEPER: "Limpieza",
  GUEST: "Invitado",
};

const STORAGE_KEY = "hotelsync-view-as-v1";
const CHANGE_EVENT = "hotelsync:view-as-changed";

function isViewAsRole(value: unknown): value is ViewAsRole {
  return (
    typeof value === "string" &&
    (VIEW_AS_ROLES as readonly string[]).includes(value)
  );
}

export function readViewAs(): ViewAsRole | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && isViewAsRole(JSON.parse(raw))) {
      return JSON.parse(raw) as ViewAsRole;
    }
  } catch {
    /* almacenamiento no disponible: sin vista simulada */
  }
  return null;
}

export function writeViewAs(role: ViewAsRole | null): void {
  try {
    if (role) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(role));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/**
 * Rol efectivo para el RENDERIZADO. Solo un SUPER_ADMIN real puede simular;
 * cualquier otro rol siempre se ve a sí mismo. El backend nunca recibe el
 * rol simulado: la sesión y los permisos reales no cambian.
 */
export function resolveViewedRole(
  realRole: string | null,
  viewAs: ViewAsRole | null
): ViewAsRole | string {
  if (realRole === "SUPER_ADMIN" && viewAs) return viewAs;
  return realRole ?? "GUEST";
}

/**
 * Vista simulada EFECTIVA: solo un SUPER_ADMIN real puede simular. Para
 * cualquier otro rol (o sin sesión) la preferencia guardada se ignora, para
 * que un valor viejo en el navegador no pinte el banner a quien no es admin.
 * Misma regla que `resolveViewedRole`, pero sobre la preferencia cruda.
 */
export function effectiveViewAs(
  realRole: string | null,
  stored: ViewAsRole | null
): ViewAsRole | null {
  return realRole === "SUPER_ADMIN" ? stored : null;
}

/** Secciones del admin visibles para cada vista (solo renderizado). */
export function adminSectionsFor(
  viewedRole: string
): Array<{ href: string; label: string }> {
  const all = [
    { href: "/admin", label: "Panel" },
    { href: "/admin/hotels", label: "Hoteles" },
    { href: "/admin/staff", label: "Personal" },
    { href: "/admin/analytics", label: "Revenue" },
    { href: "/admin/recepcion", label: "Recepción" },
    { href: "/admin/housekeeping", label: "Limpieza" },
    { href: "/admin/simulador", label: "Simulador OTA" },
  ];
  switch (viewedRole) {
    case "RECEPTIONIST":
      return all.filter((s) => s.href === "/admin/recepcion");
    case "HOUSEKEEPER":
      return all.filter((s) => s.href === "/admin/housekeeping");
    case "MANAGER":
      return all.filter(
        (s) =>
          s.href === "/admin" ||
          s.href === "/admin/hotels" ||
          s.href === "/admin/staff" ||
          s.href === "/admin/analytics"
      );
    case "SUPER_ADMIN":
      return all.filter(
        (s) =>
          s.href === "/admin/hotels" ||
          s.href === "/admin/staff" ||
          s.href === "/admin/analytics" ||
          s.href === "/admin/simulador"
      );
    case "GUEST":
      return [];
    default:
      return all;
  }
}

/** Vista simulada compartida por navbar, banner y nav del admin. */
export function useViewAs(realRole: string | null): {
  viewAs: ViewAsRole | null;
  viewedRole: ViewAsRole | string;
  setViewAs: (role: ViewAsRole | null) => void;
} {
  const [stored, setStored] = useState<ViewAsRole | null>(null);

  useEffect(() => {
    setStored(readViewAs());
    const onChange = () => setStored(readViewAs());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setStored(readViewAs());
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setViewAs = useCallback((role: ViewAsRole | null) => {
    writeViewAs(role);
    setStored(role);
  }, []);

  // GATE: la preferencia guardada solo cuenta para un SUPER_ADMIN real.
  const viewAs = effectiveViewAs(realRole, stored);

  return { viewAs, viewedRole: resolveViewedRole(realRole, viewAs), setViewAs };
}
