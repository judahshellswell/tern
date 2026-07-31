import { promises as fs } from "fs";
import path from "path";

export type WaitlistRole = "job_seeker" | "employer";

export type WaitlistEntry = {
  email: string;
  role: WaitlistRole;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "waitlist.json");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

async function readEntries(): Promise<WaitlistEntry[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as WaitlistEntry[];
  } catch {
    return [];
  }
}

async function writeEntries(entries: WaitlistEntry[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

/**
 * Local-file waitlist store for pre-launch. Swap this module for a
 * Firestore-backed implementation once `packages/firebase-config` exists —
 * callers only depend on `addToWaitlist`'s signature, not the storage.
 */
export async function addToWaitlist(
  email: string,
  role: WaitlistRole,
): Promise<{ ok: true } | { ok: false; reason: "invalid_email" | "already_registered" }> {
  const normalized = email.trim().toLowerCase();

  if (!isValidEmail(normalized)) {
    return { ok: false, reason: "invalid_email" };
  }

  const entries = await readEntries();

  if (entries.some((entry) => entry.email === normalized)) {
    return { ok: false, reason: "already_registered" };
  }

  entries.push({ email: normalized, role, createdAt: new Date().toISOString() });
  await writeEntries(entries);

  return { ok: true };
}
