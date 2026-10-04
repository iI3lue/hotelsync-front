import { NextRequest, NextResponse } from "next/server";

/**
 * BFF mínimo: los Client Components pegan a /api/* (mismo origen, con
 * cookies) y este middleware inyecta el Bearer desde la cookie HttpOnly
 * antes de que el rewrite proxee al microservicio. El access token nunca
 * queda expuesto a JavaScript.
 */
export function middleware(request: NextRequest) {
  const access = request.cookies.get("hs_access")?.value;
  if (!access) return NextResponse.next();

  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${access}`);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/api/((?!auth).*)"],
};
