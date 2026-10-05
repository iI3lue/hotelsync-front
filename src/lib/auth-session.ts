import { NextResponse } from "next/server";

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export const USER_API =
  process.env.NEXT_PUBLIC_USER_API_URL || "http://localhost:3003/v1";

export function appBaseUrl(): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function auth0Config(): {
  domain: string;
  clientId: string;
  clientSecret: string;
} | null {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  if (!domain || !clientId || !clientSecret) return null;
  return { domain, clientId, clientSecret };
}

const cookieOptions = (
  maxAge: number
): {
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  maxAge: number;
} => ({
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge,
});

export function setSessionCookies(
  response: NextResponse,
  tokens: { access_token: string; refresh_token: string }
): void {
  response.cookies.set("hs_access", tokens.access_token, cookieOptions(ACCESS_MAX_AGE));
  response.cookies.set("hs_refresh", tokens.refresh_token, cookieOptions(REFRESH_MAX_AGE));
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set("hs_access", "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
  response.cookies.set("hs_refresh", "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}

export function errorJson(message: string, status: number): NextResponse {
  return NextResponse.json({ message }, { status });
}
