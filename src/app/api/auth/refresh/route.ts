import { NextRequest, NextResponse } from "next/server";
import {
  USER_API,
  clearSessionCookies,
  errorJson,
  setSessionCookies,
} from "@/lib/auth-session";

/**
 * Rota la sesión usando la cookie HttpOnly hs_refresh. El navegador nunca
 * ve los tokens: recibe solo cookies nuevas. El access dura 15 minutos;
 * esta ruta lo renueva sin pedir login otra vez.
 */
export async function POST(request: NextRequest) {
  const refresh = request.cookies.get("hs_refresh")?.value;
  if (!refresh) return errorJson("Missing session", 401);

  const upstream = await fetch(`${USER_API}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    const response = errorJson(
      (data as { message?: string }).message || `Error ${upstream.status}`,
      upstream.status
    );
    clearSessionCookies(response);
    return response;
  }
  const tokens = data as { access_token: string; refresh_token: string };
  const response = NextResponse.json({ refreshed: true });
  setSessionCookies(response, tokens);
  return response;
}
