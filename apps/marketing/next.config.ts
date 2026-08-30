import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (specifically the /auth subpath, added for
  // banUserAccount's Auth-disable step) doesn't bundle cleanly through
  // Vercel's default tracing — it needs to stay a real Node require
  // rather than being pulled into the serverless function bundle, or
  // every route that imports lib/firebase-admin.ts fails at runtime
  // with "Failed to load external module firebase-admin.../auth".
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
