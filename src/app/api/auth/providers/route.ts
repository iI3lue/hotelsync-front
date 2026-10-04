import { NextResponse } from "next/server";
import { auth0Config } from "@/lib/auth-session";

export async function GET() {
  return NextResponse.json({ google: auth0Config() !== null });
}
