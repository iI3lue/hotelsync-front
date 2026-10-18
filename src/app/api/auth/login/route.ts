import { NextRequest, NextResponse } from "next/server";
import { USER_API, errorJson, setSessionCookies } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
    remember?: boolean;
  } | null;
  // `remember` es una decisión del BFF: no viaja al user-service.
  const upstream = await fetch(`${USER_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: body?.email,
      password: body?.password,
    }),
  });
  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return errorJson(
      (data as { message?: string }).message || `Error ${upstream.status}`,
      upstream.status
    );
  }

  const tokens = data as { access_token: string; refresh_token: string };
  const response = NextResponse.json({
    user: (data as { user: unknown }).user,
    assignment: (data as { assignment: unknown }).assignment,
  });
  setSessionCookies(response, tokens, body?.remember === true);
  return response;
}
