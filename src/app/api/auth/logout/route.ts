import { NextRequest, NextResponse } from "next/server";
import {
  USER_API,
  appBaseUrl,
  auth0Config,
  clearSessionCookies,
} from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  const refresh = request.cookies.get("hs_refresh")?.value;
  if (refresh) {
    await fetch(`${USER_API}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ logged_out: true });
  clearSessionCookies(response);

  const federated = request.nextUrl.searchParams.get("federated");
  const auth0 = auth0Config();
  if (federated && auth0) {
    return NextResponse.json({
      logged_out: true,
      federated_logout_url: `https://${auth0.domain}/v2/logout?client_id=${encodeURIComponent(
        auth0.clientId
      )}&returnTo=${encodeURIComponent(appBaseUrl())}`,
    });
  }
  return response;
}
