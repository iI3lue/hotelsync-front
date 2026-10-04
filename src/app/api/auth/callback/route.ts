import { NextRequest, NextResponse } from "next/server";
import {
  USER_API,
  appBaseUrl,
  auth0Config,
  errorJson,
  setSessionCookies,
} from "@/lib/auth-session";

function safeReturnTo(state: string | null): string {
  try {
    const parsed = JSON.parse(
      Buffer.from(state ?? "", "base64url").toString("utf8")
    ) as { returnTo?: string };
    if (
      typeof parsed.returnTo === "string" &&
      parsed.returnTo.startsWith("/") &&
      !parsed.returnTo.startsWith("//")
    ) {
      return parsed.returnTo;
    }
  } catch {
    // state inválido: destino por defecto
  }
  return "/mis-reservas";
}

/** Callback OAuth: canjea el code, vincula la cuenta y crea la sesión. */
export async function GET(request: NextRequest) {
  const auth0 = auth0Config();
  if (!auth0) return errorJson("Google login is not configured", 503);

  const code = request.nextUrl.searchParams.get("code");
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("state"));
  if (!code) {
    return NextResponse.redirect(`${appBaseUrl()}/cuenta/entrar?error=oauth`);
  }

  const tokens = await fetch(`https://${auth0.domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: auth0.clientId,
      client_secret: auth0.clientSecret,
      code,
      redirect_uri: `${appBaseUrl()}/api/auth/callback`,
    }),
  })
    .then((r) => r.json() as Promise<{ id_token?: string }>)
    .catch(() => ({} as { id_token?: string }));

  if (!tokens.id_token) {
    return NextResponse.redirect(`${appBaseUrl()}/cuenta/entrar?error=oauth`);
  }

  const federated = await fetch(`${USER_API}/auth/federated`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "auth0", id_token: tokens.id_token }),
  });
  if (!federated.ok) {
    const conflict = federated.status === 409;
    return NextResponse.redirect(
      `${appBaseUrl()}/cuenta/entrar?error=${conflict ? "linked" : "oauth"}`
    );
  }
  const session = (await federated.json()) as {
    access_token: string;
    refresh_token: string;
  };

  const response = NextResponse.redirect(`${appBaseUrl()}${returnTo}`);
  setSessionCookies(response, session);
  return response;
}
