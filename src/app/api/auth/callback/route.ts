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
    const encoded = (state ?? "").split(".")[1] ?? "";
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
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

function oauthError(message: string): NextResponse {
  const response = NextResponse.redirect(
    `${appBaseUrl()}/cuenta/entrar?error=oauth&step=${encodeURIComponent(message)}`
  );
  response.cookies.set("hs_oauth_state", "", { path: "/api/auth/callback", maxAge: 0 });
  response.cookies.set("hs_oauth_nonce", "", { path: "/api/auth/callback", maxAge: 0 });
  response.cookies.set("hs_oauth_verifier", "", { path: "/api/auth/callback", maxAge: 0 });
  response.headers.set("x-oauth-error", message);
  return response;
}

/**
 * Callback OAuth: solo acepta el flujo que este navegador inició (state
 * en cookie HttpOnly, un solo uso), canjea el code con PKCE y vincula
 * la cuenta pasando el nonce a user-service para que lo exija en el id_token.
 */
export async function GET(request: NextRequest) {
  const auth0 = auth0Config();
  if (!auth0) return errorJson("Google login is not configured", 503);

  const params = request.nextUrl.searchParams;
  const returnedState = params.get("state");
  const code = params.get("code");
  const auth0Error = params.get("error");
  if (auth0Error) {
    return oauthError(`auth0_${auth0Error}`);
  }
  const expectedState = request.cookies.get("hs_oauth_state")?.value;
  const nonce = request.cookies.get("hs_oauth_nonce")?.value;
  const verifier = request.cookies.get("hs_oauth_verifier")?.value;

  if (
    !code ||
    !returnedState ||
    !expectedState ||
    !nonce ||
    !verifier ||
    returnedState.split(".")[0] !== expectedState
  ) {
    return oauthError("invalid_state");
  }

  const returnTo = safeReturnTo(returnedState);

  const tokens = await fetch(`https://${auth0.domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: auth0.clientId,
      client_secret: auth0.clientSecret,
      code,
      redirect_uri: `${appBaseUrl()}/api/auth/callback`,
      code_verifier: verifier,
    }),
  })
    .then((r) => r.json() as Promise<{ id_token?: string }>)
    .catch(() => ({} as { id_token?: string }));

  if (!tokens.id_token) {
    return oauthError("token_exchange_failed");
  }

  const federated = await fetch(`${USER_API}/auth/federated`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "auth0",
      id_token: tokens.id_token,
      nonce,
    }),
  });
  if (!federated.ok) {
    const conflict = federated.status === 409;
    const response = NextResponse.redirect(
      `${appBaseUrl()}/cuenta/entrar?error=${conflict ? "linked" : "oauth"}&step=federated_${federated.status}`
    );
    response.cookies.set("hs_oauth_state", "", { path: "/api/auth/callback", maxAge: 0 });
    response.cookies.set("hs_oauth_nonce", "", { path: "/api/auth/callback", maxAge: 0 });
    response.cookies.set("hs_oauth_verifier", "", { path: "/api/auth/callback", maxAge: 0 });
    return response;
  }
  const session = (await federated.json()) as {
    access_token: string;
    refresh_token: string;
  };

  const response = NextResponse.redirect(`${appBaseUrl()}${returnTo}`);
  response.cookies.set("hs_oauth_state", "", { path: "/api/auth/callback", maxAge: 0 });
  response.cookies.set("hs_oauth_nonce", "", { path: "/api/auth/callback", maxAge: 0 });
  response.cookies.set("hs_oauth_verifier", "", { path: "/api/auth/callback", maxAge: 0 });
  setSessionCookies(response, session);
  return response;
}
