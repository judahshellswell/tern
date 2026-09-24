import { createVerify, X509Certificate } from "node:crypto";
import { isAdminEmail } from "./admin";

// Server-side identity for server actions. Every export of a "use server"
// module is a public endpoint, so an action can't trust a uid the
// browser passes in — it has to be proven. The client sends its Firebase
// ID token (lib/id-token.ts) and we verify it here.
//
// Verified by hand with node:crypto against Google's published signing
// certs rather than via firebase-admin/auth's verifyIdToken: that module
// pulls in jwks-rsa → jose, which has broken Vercel's serverless bundles
// twice (see lib/firebase-admin.ts). The checks below are the ones
// Firebase documents for verifying ID tokens with a third-party library.

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const CLOCK_SKEW_SECONDS = 60;

let certCache: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getSigningCerts(forceRefresh = false): Promise<Record<string, string>> {
  if (!forceRefresh && certCache && certCache.expiresAt > Date.now()) return certCache.certs;
  const res = await fetch(CERTS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch Firebase signing certs: ${res.status}`);
  const certs = (await res.json()) as Record<string, string>;
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") ?? "")?.[1] ?? 3600);
  certCache = { certs, expiresAt: Date.now() + maxAge * 1000 };
  return certs;
}

export class AuthError extends Error {}

export type Caller = { uid: string; email: string | null; emailVerified: boolean };

export async function verifyIdToken(token: unknown): Promise<Caller> {
  if (typeof token !== "string") throw new AuthError("Not signed in.");
  const parts = token.split(".");
  if (parts.length !== 3) throw new AuthError("Malformed token.");

  let header: { alg?: string; kid?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new AuthError("Malformed token.");
  }
  if (header.alg !== "RS256" || !header.kid) throw new AuthError("Invalid token header.");

  let pem = (await getSigningCerts())[header.kid];
  if (!pem) pem = (await getSigningCerts(true))[header.kid]; // keys rotate
  if (!pem) throw new AuthError("Unknown token signing key.");

  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  if (!verifier.verify(new X509Certificate(pem).publicKey, Buffer.from(parts[2], "base64url"))) {
    throw new AuthError("Invalid token signature.");
  }

  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const now = Math.floor(Date.now() / 1000);
  if (
    !projectId ||
    payload.aud !== projectId ||
    payload.iss !== `https://securetoken.google.com/${projectId}` ||
    typeof payload.exp !== "number" ||
    payload.exp < now - CLOCK_SKEW_SECONDS ||
    typeof payload.iat !== "number" ||
    payload.iat > now + CLOCK_SKEW_SECONDS ||
    (typeof payload.auth_time === "number" && payload.auth_time > now + CLOCK_SKEW_SECONDS) ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    payload.sub.length > 128
  ) {
    throw new AuthError("Invalid or expired token.");
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
    emailVerified: payload.email_verified === true,
  };
}

export async function requireUser(token: unknown): Promise<Caller> {
  return verifyIdToken(token);
}

// Same check as firestore.rules' isAdmin(): the signed-in email matches
// the hardcoded admin address.
export async function requireAdmin(token: unknown): Promise<Caller> {
  const caller = await verifyIdToken(token);
  if (!isAdminEmail(caller.email)) throw new AuthError("Admin only.");
  return caller;
}
