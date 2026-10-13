import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth-session";
import { getSessionScope } from "@/lib/server-session";

const CHANNEL_MANAGER_API =
  process.env.CHANNEL_MANAGER_API_URL || "http://localhost:3008/v1";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * POST /api/simulator/reservations: ingesta OTA de prueba (canal simulado).
 * Solo SUPER_ADMIN. La provider-key vive solo en el servidor (env
 * CHANNEL_MANAGER_SIMULATOR_KEY) y se inyecta como x-provider-key hacia el
 * channel-manager; el navegador jamás la ve. Los estados del upstream
 * (201/200/409/400) se propagan tal cual para que la UI los muestre.
 */
export async function POST(request: NextRequest) {
  const session = await getSessionScope();
  if (session.role !== "SUPER_ADMIN") {
    return errorJson("Forbidden", 403);
  }

  const providerKey = process.env.CHANNEL_MANAGER_SIMULATOR_KEY;
  if (!providerKey) {
    return errorJson("Simulator not configured (missing provider key)", 503);
  }

  const body = (await request.json().catch(() => null)) as unknown;
  if (!isRecord(body)) return errorJson("Invalid body", 400);

  const { hotel_id, room_type_id, check_in, check_out, total_amount, guest } =
    body;
  if (
    typeof hotel_id !== "string" ||
    !UUID_RE.test(hotel_id) ||
    typeof room_type_id !== "string" ||
    !UUID_RE.test(room_type_id) ||
    typeof check_in !== "string" ||
    !DATE_RE.test(check_in) ||
    typeof check_out !== "string" ||
    !DATE_RE.test(check_out) ||
    !(check_out > check_in) ||
    typeof total_amount !== "number" ||
    total_amount < 0 ||
    !isRecord(guest) ||
    typeof guest.name !== "string" ||
    guest.name.trim().length === 0 ||
    typeof guest.email !== "string" ||
    !guest.email.includes("@") ||
    typeof guest.phone !== "string" ||
    guest.phone.trim().length === 0
  ) {
    return errorJson("Invalid reservation payload", 400);
  }

  const external_id =
    typeof body.external_id === "string" && body.external_id.trim().length > 0
      ? body.external_id.trim().slice(0, 100)
      : `SIM-${Date.now().toString(36).toUpperCase()}`;

  let upstream: Response;
  try {
    upstream = await fetch(
      `${CHANNEL_MANAGER_API}/simulator/simulado/reservations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-provider-key": providerKey,
        },
        // Los backends en plan free despiertan lento: se corta a los 45s
        // para devolver 503 en vez de colgar el navegador (timeout Vercel).
        signal: AbortSignal.timeout(45_000),
        body: JSON.stringify({
          external_id,
          hotel_id,
          room_type_id,
          check_in,
          check_out,
          total_amount,
          guest: {
            name: guest.name.trim(),
            email: guest.email.trim(),
            phone: guest.phone.trim(),
          },
        }),
      }
    );
  } catch {
    return errorJson("Channel manager unavailable (timeout)", 503);
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return errorJson(
      (data as { message?: string }).message || `Error ${upstream.status}`,
      upstream.status
    );
  }
  return NextResponse.json(data, { status: upstream.status });
}
