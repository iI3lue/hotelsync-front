import { NextRequest, NextResponse } from "next/server";
import { USER_API, errorJson } from "@/lib/auth-session";

/**
 * Aceptación del tratamiento de datos. Reenvía al user-service con el
 * access de la cookie HttpOnly (mismo patrón que PATCH /api/auth/me).
 */
export async function POST(request: NextRequest) {
  const access = request.cookies.get("hs_access")?.value;
  if (!access) return errorJson("Missing session", 401);
  const body = await request.json().catch(() => ({}));
  const upstream = await fetch(`${USER_API}/users/me/consent`, {
    method: "POST",
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
