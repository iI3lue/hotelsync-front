/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    return [
      {
        source: "/api/property/:path*",
        destination: `${process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:3001/v1"}/:path*`,
      },
      {
        source: "/api/rate/:path*",
        destination: `${process.env.NEXT_PUBLIC_RATE_API_URL || "http://localhost:3002/v1"}/:path*`,
      },
      {
        source: "/api/users/:path*",
        destination: `${process.env.NEXT_PUBLIC_USER_API_URL || "http://localhost:3003/v1"}/:path*`,
      },
      {
        source: "/api/booking/:path*",
        destination: `${process.env.NEXT_PUBLIC_BOOKING_API_URL || "http://localhost:3004/v1"}/:path*`,
      },
      {
        source: "/api/front-desk/:path*",
        destination: `${process.env.NEXT_PUBLIC_FRONT_DESK_API_URL || "http://localhost:3005/v1"}/:path*`,
      },
      {
        source: "/api/housekeeping/:path*",
        destination: `${process.env.NEXT_PUBLIC_HOUSEKEEPING_API_URL || "http://localhost:3006/v1"}/:path*`,
      },
      {
        source: "/api/billing/:path*",
        destination: `${process.env.NEXT_PUBLIC_BILLING_API_URL || "http://localhost:3007/v1"}/:path*`,
      },
      {
        source: "/api/loyalty/:path*",
        destination: `${process.env.NEXT_PUBLIC_LOYALTY_API_URL || "http://localhost:3009/v1"}/:path*`,
      }
    ];
  },
};

module.exports = nextConfig;
