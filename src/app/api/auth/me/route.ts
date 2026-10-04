import { NextRequest, NextResponse } from "next/server";
import { USER_API, errorJson } from "@/lib/auth-session";

export async function GET(request: NextRequest) {
  const access = request.cookies.get("hs_access")?.value;
  if (!access) return errorJson("Missing session", 401);

  const upstream = await fetch(`${USER_API}/users/me`, {
    headers: { Authorization: `Bearer ${access}` },
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
