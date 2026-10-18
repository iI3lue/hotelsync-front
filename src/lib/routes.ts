export const ROUTES = {
  home: "/",
  search: "/buscar",
  login: "/cuenta/entrar",
  register: "/cuenta/crear",
  profile: "/cuenta/perfil",
  myBookings: "/mis-reservas",
  admin: "/admin",
  adminHotels: "/admin/hotels",
  adminReception: "/admin/recepcion",
  adminHousekeeping: "/admin/housekeeping",
  adminAnalytics: "/admin/analytics",
} as const;

/**
 * Páginas legales: públicas para todos los roles y exentas del gate de
 * consentimiento (se abren en una pestaña nueva desde el registro y el modal).
 */
export const LEGAL_PATHS: readonly string[] = ["/terminos", "/privacidad"];

export function defaultRouteForRole(role: string): string {
  switch (role) {
    case "RECEPTIONIST":
      return ROUTES.adminReception;
    case "HOUSEKEEPER":
      return ROUTES.adminHousekeeping;
    case "MANAGER":
    case "SUPER_ADMIN":
      return ROUTES.admin;
    case "GUEST":
    default:
      return ROUTES.home;
  }
}

export function isAllowedPathForRole(role: string, pathname: string): boolean {
  if (LEGAL_PATHS.includes(pathname)) return true;
  if (role === "SUPER_ADMIN") return true;

  // Personal operativo: solo su área + cuenta. El portal público (home,
  // catálogo, reservas) está bloqueado y redirige a su panel.
  if (role === "RECEPTIONIST" || role === "HOUSEKEEPER") {
    if (pathname.startsWith("/admin")) {
      return role === "RECEPTIONIST"
        ? pathname.startsWith(ROUTES.adminReception)
        : pathname.startsWith(ROUTES.adminHousekeeping);
    }
    return pathname.startsWith("/cuenta");
  }

  if (!pathname.startsWith("/admin")) return true;

  switch (role) {
    case "MANAGER":
      return (
        pathname === ROUTES.admin ||
        pathname.startsWith(ROUTES.adminHotels) ||
        pathname.startsWith(ROUTES.adminAnalytics) ||
        pathname.startsWith("/admin/staff")
      );
    default:
      return false;
  }
}
