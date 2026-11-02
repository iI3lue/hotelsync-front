/** @type {import('next').NextConfig} */
const GATEWAY_URL = (process.env.GATEWAY_URL || "").replace(/\/+$/, "");
const GATEWAY_SERVICES = new Set(
  (process.env.GATEWAY_SERVICES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

function destination(service, directUrl) {
  if (GATEWAY_URL && GATEWAY_SERVICES.has(service)) {
    return `${GATEWAY_URL}/${service}/:path*`;
  }
  return `${directUrl}/:path*`;
}

const nextConfig = {
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    return [
      {
        source: "/api/property/:path*",
        destination: destination(
          "property",
          process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:3001/v1"
        ),
      },
      {
        source: "/api/rate/:path*",
        destination: destination(
          "rate",
          process.env.NEXT_PUBLIC_RATE_API_URL || "http://localhost:3002/v1"
        ),
      },
      {
        source: "/api/users/:path*",
        destination: destination(
          "users",
          process.env.NEXT_PUBLIC_USER_API_URL || "http://localhost:3003/v1"
        ),
      },
      {
        source: "/api/booking/:path*",
        destination: destination(
          "booking",
          process.env.NEXT_PUBLIC_BOOKING_API_URL || "http://localhost:3004/v1"
        ),
      },
      {
        source: "/api/front-desk/:path*",
        destination: destination(
          "front-desk",
          process.env.NEXT_PUBLIC_FRONT_DESK_API_URL || "http://localhost:3005/v1"
        ),
      },
      {
        source: "/api/housekeeping/:path*",
        destination: destination(
          "housekeeping",
          process.env.NEXT_PUBLIC_HOUSEKEEPING_API_URL || "http://localhost:3006/v1"
        ),
      },
      {
        source: "/api/billing/:path*",
        destination: destination(
          "billing",
          process.env.NEXT_PUBLIC_BILLING_API_URL || "http://localhost:3007/v1"
        ),
      },
      {
        source: "/api/loyalty/:path*",
        destination: destination(
          "loyalty",
          process.env.NEXT_PUBLIC_LOYALTY_API_URL || "http://localhost:3009/v1"
        ),
      },
      {
        source: "/api/payments/:path*",
        destination: destination(
          "payments",
          process.env.NEXT_PUBLIC_PAYMENT_API_URL || "http://localhost:3010/v1"
        ),
      },
      {
        source: "/api/analytics/:path*",
        destination: destination(
          "analytics",
          process.env.NEXT_PUBLIC_ANALYTICS_API_URL || "http://localhost:3011/v1"
        ),
      },
    ];
  },
};

module.exports = nextConfig;
