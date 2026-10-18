type Env = Record<string, string | undefined>;

type ServiceTarget = {
  name: string;
  envKey: string;
  fallback: string;
};

export type HealthTarget = {
  name: string;
  url: string;
};

const SERVICES: ServiceTarget[] = [
  {
    name: "property",
    envKey: "NEXT_PUBLIC_PROPERTY_API_URL",
    fallback: "http://localhost:3001/v1",
  },
  {
    name: "rate-availability",
    envKey: "NEXT_PUBLIC_RATE_API_URL",
    fallback: "http://localhost:3002/v1",
  },
  {
    name: "user",
    envKey: "NEXT_PUBLIC_USER_API_URL",
    fallback: "http://localhost:3003/v1",
  },
  {
    name: "booking",
    envKey: "NEXT_PUBLIC_BOOKING_API_URL",
    fallback: "http://localhost:3004/v1",
  },
  {
    name: "front-desk",
    envKey: "NEXT_PUBLIC_FRONT_DESK_API_URL",
    fallback: "http://localhost:3005/v1",
  },
  {
    name: "housekeeping",
    envKey: "NEXT_PUBLIC_HOUSEKEEPING_API_URL",
    fallback: "http://localhost:3006/v1",
  },
  {
    name: "billing",
    envKey: "NEXT_PUBLIC_BILLING_API_URL",
    fallback: "http://localhost:3007/v1",
  },
  {
    name: "channel-manager",
    envKey: "CHANNEL_MANAGER_API_URL",
    fallback: "http://localhost:3008/v1",
  },
  {
    name: "loyalty",
    envKey: "NEXT_PUBLIC_LOYALTY_API_URL",
    fallback: "http://localhost:3009/v1",
  },
  {
    name: "payment",
    envKey: "NEXT_PUBLIC_PAYMENT_API_URL",
    fallback: "http://localhost:3010/v1",
  },
  {
    name: "analytics",
    envKey: "NEXT_PUBLIC_ANALYTICS_API_URL",
    fallback: "http://localhost:3011/v1",
  },
];

export function healthUrl(base: string): string {
  const root = base.trim().replace(/\/+$/, "").replace(/\/v1$/i, "");
  return `${root}/health`;
}

export function buildHealthTargets(env: Env = process.env): HealthTarget[] {
  return SERVICES.map(({ name, envKey, fallback }) => ({
    name,
    url: healthUrl(env[envKey] || fallback),
  }));
}
