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
 */
export function middleware(request: NextRequest) {
  const access = request.cookies.get("hs_access")?.value;

  const headers = new Headers(request.headers);
  if (access) headers.set("Authorization", `Bearer ${access}`);
  else headers.delete("Authorization");

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/api/((?!auth).*)"],
};
