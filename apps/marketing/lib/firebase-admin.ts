import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { ADMIN_EMAILS } from "./admin";

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let firestore: Firestore | null = null;

export function getAdminFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getAdminApp());
  }
  return firestore;
}

let auth: Auth | null = null;

// Dynamically imported — firebase-admin/auth pulls in jwks-rsa, which
// requires the ESM-only "jose" package via a CommonJS require() that
// Vercel's Node runtime can't resolve. A top-level static import of
// firebase-admin/auth broke every route importing this module (even
// ones that only ever call getAdminFirestore()), since it loaded at
// import time regardless of whether Auth was actually used. Deferring
// it to only load inside this function keeps that failure scoped to
// the one thing that actually needs it — banUserAccount's Auth-disable
// step — instead of taking down /jobs/[id] and every other page.
export async function getAdminAuth(): Promise<Auth> {
  if (!auth) {
    const { getAuth } = await import("firebase-admin/auth");
    auth = getAuth(getAdminApp());
  }
  return auth;
}

let cachedAdminUid: string | null = null;

// Resolves ADMIN_EMAILS[0] to a Firebase Auth uid, cached per server
// process (cold starts re-resolve — cheap, a single getUserByEmail
// call). Used to write in-app notifications for the admin, since
// notifications are stored per-uid and the admin is only known by
// email everywhere else in this app.
export async function getAdminUid(): Promise<string | null> {
  if (cachedAdminUid) return cachedAdminUid;
  try {
    const authInstance = await getAdminAuth();
    const user = await authInstance.getUserByEmail(ADMIN_EMAILS[0]);
    cachedAdminUid = user.uid;
    return cachedAdminUid;
  } catch (err) {
    console.error("Failed to resolve admin uid:", err);
    return null;
  }
}
