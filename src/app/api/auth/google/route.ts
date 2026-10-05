import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { appBaseUrl, auth0Config, errorJson } from "@/lib/auth-session";

const OAUTH_COOKIE_MAX_AGE = 10 * 60;

function base64url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Inicia el flujo OAuth con Google vía Auth0 (code + PKCE S256).
 * Guarda state, nonce y code_verifier en cookies HttpOnly de corta vida:
 * el callback solo acepta el flujo que este navegador inició.
 */
export async function GET(request: NextRequest) {
  const auth0 = auth0Config();
  if (!auth0) return errorJson("Google login is not configured", 503);

  const returnTo =
    request.nextUrl.searchParams.get("returnTo") || "/mis-reservas";
  const state = base64url(randomBytes(24));
  const nonce = base64url(randomBytes(24));
  const verifier = base64url(randomBytes(64));
  const challenge = base64url(
    createHash("sha256").update(verifier).digest()
  );

  const authorize = new URL(`https://${auth0.domain}/authorize`);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", auth0.clientId);
  authorize.searchParams.set(
    "redirect_uri",
    `${appBaseUrl()}/api/auth/callback`
  );
  authorize.searchParams.set("scope", "openid profile email");
  authorize.searchParams.set("connection", "google-oauth2");
  authorize.searchParams.set("state", `${state}.${base64url(Buffer.from(JSON.stringify({ returnTo })))}`);
  authorize.searchParams.set("nonce", nonce);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");

  const secure = process.env.NODE_ENV === "production";
  const response = NextResponse.redirect(authorize);
  const cookieInit = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/api/auth/callback",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  };
  response.cookies.set("hs_oauth_state", state, cookieInit);
  response.cookies.set("hs_oauth_nonce", nonce, cookieInit);
  response.cookies.set("hs_oauth_verifier", verifier, cookieInit);
  return response;
}
