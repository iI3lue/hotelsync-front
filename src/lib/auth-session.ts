import { NextRequest, NextResponse } from "next/server";

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

/** Cookie que recuerda la elección de "Recordarme" a través de rotaciones. */
export const REMEMBER_COOKIE = "hs_remember";

export const USER_API =
  process.env.NEXT_PUBLIC_USER_API_URL || "http://localhost:3003/v1";

export function appBaseUrl(): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function auth0Config(): {
  domain: string;
  clientId: string;
  clientSecret: string;
} | null {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  if (!domain || !clientId || !clientSecret) return null;
  return { domain, clientId, clientSecret };
}

const cookieOptions = (
  maxAge?: number
): {
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  maxAge?: number;
} => ({
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  // Sin maxAge la cookie es de sesión: muere al cerrar el navegador.
  ...(maxAge !== undefined ? { maxAge } : {}),
});

/**
 * Setea la sesión. Con `remember` (default, compatibilidad) el refresh
 * dura 7 días; sin él es cookie de sesión: al cerrar el navegador hay que
 * volver a entrar. La elección se persiste en hs_remember para que las
 * rotaciones (refresh, me silencioso) no la conviertan en persistente.
 */
export function setSessionCookies(
  response: NextResponse,
  tokens: { access_token: string; refresh_token: string },
  remember = true
): void {
  response.cookies.set("hs_access", tokens.access_token, cookieOptions(ACCESS_MAX_AGE));
  response.cookies.set(
    "hs_refresh",
    tokens.refresh_token,
    cookieOptions(remember ? REFRESH_MAX_AGE : undefined)
  );
  response.cookies.set(
    REMEMBER_COOKIE,
    remember ? "1" : "0",
    cookieOptions(REFRESH_MAX_AGE)
  );
}

/** Elección de "Recordarme" vigente (ausente = persistente, previo al cambio). */
export function readRemember(request: NextRequest): boolean {
  return request.cookies.get(REMEMBER_COOKIE)?.value !== "0";
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set("hs_access", "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
  response.cookies.set("hs_refresh", "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
  response.cookies.set(REMEMBER_COOKIE, "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}

export function errorJson(message: string, status: number): NextResponse {
  return NextResponse.json({ message }, { status });
}
