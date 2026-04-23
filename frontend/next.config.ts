import type { NextConfig } from "next";

// BACKEND_URL is a server-side env var (set in Railway/Vercel dashboard).
// Never prefix with NEXT_PUBLIC_ — keeps the Railway URL out of the client bundle.
const BACKEND_URL =
  process.env.BACKEND_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8001" : "");

const nextConfig: NextConfig = {
  async rewrites() {
    // All /api/* and /health requests are proxied server-side to FastAPI.
    // This makes cookies same-origin so Safari ITP cannot block them.
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/health",     destination: `${BACKEND_URL}/health` },
    ];
  },
};

export default nextConfig;
