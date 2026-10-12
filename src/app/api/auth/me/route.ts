import { NextRequest, NextResponse } from "next/server";
import {
  USER_API,
  clearSessionCookies,
  errorJson,
  setSessionCookies,
} from "@/lib/auth-session";

async function fetchMe(access: string): Promise<Response> {
  return fetch(`${USER_API}/users/me`, {
    headers: { Authorization: `Bearer ${access}` },
  });
}

/**
 * Perfil de la sesión. Si el access expiró (15 min) pero hay refresh
 * válido, rota en silencio y reintenta: el usuario no ve el vencimiento.
 */
export async function GET(request: NextRequest) {
  let access = request.cookies.get("hs_access")?.value;
  const refresh = request.cookies.get("hs_refresh")?.value;
  if (!access && !refresh) return errorJson("Missing session", 401);

  let upstream = access
    ? await fetchMe(access)
    : new Response(null, { status: 401 });
  let data = await upstream.json().catch(() => ({}));

  if (upstream.status === 401 && refresh) {
    const rotated = await fetch(`${USER_API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    const rotatedData = (await rotated.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
    };
    if (!rotated.ok || !rotatedData.access_token || !rotatedData.refresh_token) {
      const response = errorJson("Missing session", 401);
      clearSessionCookies(response);
      return response;
    }
    upstream = await fetchMe(rotatedData.access_token);
    data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return errorJson(
        (data as { message?: string }).message || `Error ${upstream.status}`,
        upstream.status
      );
    }
    const response = NextResponse.json(data);
    setSessionCookies(response, {
      access_token: rotatedData.access_token,
      refresh_token: rotatedData.refresh_token,
    });
    return response;
  }

  if (!upstream.ok) {
    return errorJson(
      (data as { message?: string }).message || `Error ${upstream.status}`,
      upstream.status
    );
  }
  return NextResponse.json(data);
}

/**
 * PATCH /api/auth/me: actualiza nombre/teléfono del perfil propio.
 * Reenvía al user-service con el access de la cookie HttpOnly.
 */
export async function PATCH(request: NextRequest) {
  const access = request.cookies.get("hs_access")?.value;
  if (!access) return errorJson("Missing session", 401);
  const body = await request.json().catch(() => ({}));
  const upstream = await fetch(`${USER_API}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access}`,
    },
    body: JSON.stringify(body),
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return errorJson(
      (data as { message?: string }).message || `Error ${upstream.status}`,
      upstream.status
    );
  }
  return NextResponse.json(data);
}
