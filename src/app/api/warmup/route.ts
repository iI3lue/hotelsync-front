import { NextResponse } from "next/server";
import { timeoutSignal } from "@/lib/timeout-signal";
import { buildHealthTargets } from "@/lib/warmup-targets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const HEALTH_TIMEOUT_MS = 12_000;

type ServiceStatus = {
  name: string;
  status: number | null;
};

/**
 * GET /api/warmup: despierta los 11 microservicios en paralelo.
 * Corre del lado del servidor para evitar CORS y para no exponer
 * CHANNEL_MANAGER_API_URL ni claves al navegador. Fire-and-forget:
 * responde 200 aunque algún backend todavía esté arrancando.
 */
export async function GET() {
  const targets = buildHealthTargets();

  const results = await Promise.allSettled(
    targets.map(async (target) => {
      const response = await fetch(target.url, {
        cache: "no-store",
        signal: timeoutSignal(HEALTH_TIMEOUT_MS),
      });
      return { name: target.name, status: response.status };
    })
  );

  const services: ServiceStatus[] = results.map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : { name: targets[index].name, status: null }
  );

  return NextResponse.json({
    ok: services.every((service) => service.status !== null),
    services,
  });
}
