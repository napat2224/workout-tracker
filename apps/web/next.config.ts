import type { NextConfig } from "next";

/** Where the Nest API lives. Server-side only — never inlined into the bundle. */
const API_URL = process.env.API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  /**
   * Proxy browser-side calls to Nest through Next's own origin.
   *
   * Client Components can `fetch("/api/sessions")` with no base URL, no CORS
   * preflight, and no API host in the client bundle. Server Components skip
   * this entirely and call `API_URL` directly (see lib/api.ts).
   */
  rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
