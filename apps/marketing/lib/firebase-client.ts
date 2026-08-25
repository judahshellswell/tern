import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Object.values(firebaseConfig).every(Boolean);
}

function getClientApp(): FirebaseApp {
  const existing = getApps();
  if (existing.length > 0) return existing[0];
  return initializeApp(firebaseConfig);
}

let auth: Auth | null = null;
let firestore: Firestore | null = null;

// Firebase throws synchronously if the config is missing/malformed (e.g. an
// env var didn't make it into this build). A page that doesn't even use auth
// shouldn't be taken down by that, so callers check isFirebaseConfigured()
// first and these throw a clear error rather than a cryptic SDK one if not.
export function getClientAuth(): Auth {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase client config is missing — check NEXT_PUBLIC_FIREBASE_* env vars.");
  }
  if (!auth) auth = getAuth(getClientApp());
  return auth;
}

export function getClientFirestore(): Firestore {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase client config is missing — check NEXT_PUBLIC_FIREBASE_* env vars.");
  }
  if (!firestore) firestore = getFirestore(getClientApp());
  return firestore;
}

export const googleAuthProvider = new GoogleAuthProvider();
