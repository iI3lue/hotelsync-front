import { NextRequest, NextResponse } from "next/server";
import { appBaseUrl, auth0Config, errorJson } from "@/lib/auth-session";

/** Inicia el flujo OAuth con Google vía Auth0 (code + PKCE simplificado). */
export async function GET(request: NextRequest) {
  const auth0 = auth0Config();
  if (!auth0) return errorJson("Google login is not configured", 503);

  const returnTo =
    request.nextUrl.searchParams.get("returnTo") || "/mis-reservas";
  const state = Buffer.from(
    JSON.stringify({ returnTo, nonce: crypto.randomUUID() })
  ).toString("base64url");

  const authorize = new URL(`https://${auth0.domain}/authorize`);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", auth0.clientId);
  authorize.searchParams.set(
    "redirect_uri",
    `${appBaseUrl()}/api/auth/callback`
  );
  authorize.searchParams.set("scope", "openid profile email");
  authorize.searchParams.set("connection", "google-oauth2");
  authorize.searchParams.set("state", state);

  return NextResponse.redirect(authorize);
}
