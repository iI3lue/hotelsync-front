import { NextRequest, NextResponse } from "next/server";

/**
 * BFF mínimo: los Client Components pegan a /api/* (mismo origen, con
 * cookies) y este middleware inyecta el Bearer desde la cookie HttpOnly
 * antes de que el rewrite proxee al microservicio. El access token nunca
 * queda expuesto a JavaScript.
 *
 * A propósito NO rota la sesión acá: las cookies seteadas sobre
 * NextResponse.next() se pierden en respuestas que pasan por rewrite
 * externo, y rotar sin actualizar el jar consumiría el refresh token
 * dejando la sesión colgada. La renovación vive en /api/auth/refresh,
 * en el reintento silencioso de /api/auth/me y en el retry con
 * single-flight de api-client (fetchWithSession).
 *
 * Además: protección de rutas /admin a nivel servidor y bloqueo del
 * portal público para el personal operativo (RECEPTIONIST/HOUSEKEEPER
 * redirigen a su área). Decodifica el JWT (sin verificar firma — eso lo
 * hace cada microservicio con el Bearer) para obtener el rol y redirigir
 * si el rol no permite el acceso. Esto evita parpadeos de contenido no
 * autorizado antes del redirect en cliente. La seguridad real sigue en
 * el backend.
 */

interface JwtPayload {
  role?: string;
}

function decodeJwtRole(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    ) as JwtPayload;
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function defaultRouteForRole(role: string): string {
  switch (role) {
    case "RECEPTIONIST":
      return "/admin/recepcion";
    case "HOUSEKEEPER":
      return "/admin/housekeeping";
    case "MANAGER":
    case "SUPER_ADMIN":
      return "/admin";
    case "GUEST":
    default:
      return "/";
  }
}

function isStaffRole(role: string): boolean {
  return role === "RECEPTIONIST" || role === "HOUSEKEEPER";
}

function isAllowedAdminPath(role: string, pathname: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  switch (role) {
    case "RECEPTIONIST":
      return pathname.startsWith("/admin/recepcion");
    case "HOUSEKEEPER":
      return pathname.startsWith("/admin/housekeeping");
    case "MANAGER":
      return (
        pathname === "/admin" ||
        pathname.startsWith("/admin/hotels") ||
        pathname.startsWith("/admin/staff")
      );
    default:
      return false;
  }
}

export function middleware(request: NextRequest) {
  const access = request.cookies.get("hs_access")?.value;

  const headers = new Headers(request.headers);
  if (access) headers.set("Authorization", `Bearer ${access}`);
  else headers.delete("Authorization");

  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith("/admin");
  const isApiPath = pathname.startsWith("/api/");

  // Las llamadas a la API solo reciben el Bearer inyectado, nunca redirect.
  if (isApiPath) {
    return NextResponse.next({ request: { headers } });
  }

  const role = access ? decodeJwtRole(access) : null;

  if (!isAdminPath) {
    // Personal operativo: el portal público está bloqueado, va a su área.
    // Se excluye /cuenta (perfil permitido; el login redirige solo).
    if (role && isStaffRole(role) && !pathname.startsWith("/cuenta")) {
      return NextResponse.redirect(new URL(defaultRouteForRole(role), request.url));
    }
    return NextResponse.next({ request: { headers } });
  }

  if (access && !role) {
    return NextResponse.next({ request: { headers } });
  }

  if (!role || role === "GUEST") {
    const loginUrl = new URL("/cuenta/entrar", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isAllowedAdminPath(role, pathname)) {
    return NextResponse.redirect(new URL(defaultRouteForRole(role), request.url));
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/api/((?!auth).*)",
    "/admin/:path*",
    "/",
    "/buscar",
    "/mis-reservas",
    "/hotels/:path*",
    "/reservas/:path*",
  ],
};
