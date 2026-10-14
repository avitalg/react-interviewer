import type { NextConfig } from "next";
import { SANDBOX_CSP, SANDBOX_PERMISSIONS_POLICY } from "./src/sandbox/csp";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["@babel/standalone"],
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/sandbox/frame.html",
        headers: [
          { key: "Content-Security-Policy", value: SANDBOX_CSP },
          { key: "Permissions-Policy", value: SANDBOX_PERMISSIONS_POLICY },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Opaque-origin iframe + crossorigin="anonymous" so script errors keep their messages.
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/sandbox/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
