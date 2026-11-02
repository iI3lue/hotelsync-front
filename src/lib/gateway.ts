export const GATEWAY_SERVICE_NAMES = [
  "property",
  "rate",
  "users",
  "booking",
  "front-desk",
  "housekeeping",
  "billing",
  "loyalty",
  "payments",
  "analytics",
] as const;

export type GatewayServiceName = (typeof GATEWAY_SERVICE_NAMES)[number];

export function parseGatewayServices(raw: string | undefined | null): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

export function isGatewayServiceEnabled(
  raw: string | undefined | null,
  service: string
): boolean {
  return parseGatewayServices(raw).has(service);
}

export function resolveClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() ?? "";
}
