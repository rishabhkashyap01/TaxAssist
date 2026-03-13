import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In local dev, proxy /api/* to FastAPI so cookies are same-origin
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8001/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
