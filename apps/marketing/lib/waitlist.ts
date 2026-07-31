import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "./firebase-admin";

export type WaitlistRole = "job_seeker" | "employer";

export type WaitlistEntry = {
  email: string;
  role: WaitlistRole;
  createdAt: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLLECTION = "waitlist";

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

/**
 * Firestore-backed waitlist store. The email address is used as the
 * document ID so duplicate signups are a single get-or-create rather
 * than a collection scan.
 */
export async function addToWaitlist(
  email: string,
  role: WaitlistRole,
): Promise<{ ok: true } | { ok: false; reason: "invalid_email" | "already_registered" }> {
  const normalized = email.trim().toLowerCase();

  if (!isValidEmail(normalized)) {
    return { ok: false, reason: "invalid_email" };
  }

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc(normalized);

  const created = await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (doc.exists) return false;

    tx.set(ref, {
      email: normalized,
      role,
      createdAt: FieldValue.serverTimestamp(),
    });
    return true;
  });

  if (!created) {
    return { ok: false, reason: "already_registered" };
  }

  return { ok: true };
}
