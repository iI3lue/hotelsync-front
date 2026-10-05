import { NextResponse } from "next/server";
import {
  fallbackPayload,
  parseErApiResponse,
  type RatesPayload,
} from "@/lib/rates";

export const dynamic = "force-dynamic";

const PROVIDER_URL = "https://open.er-api.com/v6/latest/COP";
const CACHE_TTL_MS = 30 * 60 * 1000;

let cached: { at: number; payload: RatesPayload } | null = null;

/**
 * Cotización en vivo (base COP) para la conversión visual del front.
 * El dominio factura todo en COP: esto nunca toca precios, solo alimenta
 * al CurrencyProvider. Cache server de 30 min; si el proveedor cae se
 * responde lo último conocido (o el fallback estático) con live: false.
 */
export async function GET() {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return NextResponse.json(cached.payload);
  }

  try {
    const upstream = await fetch(PROVIDER_URL, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });
    if (!upstream.ok) throw new Error(`provider ${upstream.status}`);
    const { rates, updatedUtc } = parseErApiResponse(await upstream.json());
    const payload: RatesPayload = {
      base: "COP",
      rates,
      updated_utc: updatedUtc,
      live: true,
    };
    cached = { at: now, payload };
    return NextResponse.json(payload);
  } catch {
    if (cached) {
      return NextResponse.json({ ...cached.payload, live: false });
    }
    return NextResponse.json(fallbackPayload());
  }
}
