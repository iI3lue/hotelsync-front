import { NextRequest, NextResponse } from "next/server";
import { USER_API, errorJson } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const upstream = await fetch(`${USER_API}/auth/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return errorJson(
      (data as { message?: string }).message || `Error ${upstream.status}`,
      upstream.status
    );
  }
  return NextResponse.json({ ok: true });
}
