import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (specifically the /auth subpath, added for
  // banUserAccount's Auth-disable step) doesn't bundle cleanly through
  // Vercel's default tracing — it needs to stay a real Node require
  // rather than being pulled into the serverless function bundle, or
  // every route that imports lib/firebase-admin.ts fails at runtime
  // with "Failed to load external module firebase-admin.../auth".
  serverExternalPackages: ["firebase-admin"],

  // The service worker must never be cached, or users would be stuck on
  // an old version of the push handler.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
