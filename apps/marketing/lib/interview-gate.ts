import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import {
  INTERVIEW_SLOT_LENGTH_MINUTES,
  INTERVIEW_SLOT_SPACING_MINUTES,
  type InterviewBooking,
  type InterviewSlot,
} from "./types";

// A unique, unguessable Jitsi room per slot — Jitsi Meet needs no
// account or API key, any https://meet.jit.si/{room} URL just works,
// and a long random room name is all that keeps it private (anyone
// with the link can join, same as any Jitsi call).
function makeMeetingUrl(): string {
  return `https://meet.jit.si/Tern-Interview-${randomUUID().replace(/-/g, "")}`;
}

// Generates bookable slot start times across [windowStart, windowEnd),
// one every INTERVIEW_SLOT_SPACING_MINUTES, each lasting
// INTERVIEW_SLOT_LENGTH_MINUTES. The spacing (not the length) determines
// how far apart slots are — a 15-minute call on a 30-minute spacing
// always leaves a 15-minute buffer, regardless of how long the call
// actually runs.
export function generateSlotTimes(windowStart: Date, windowEnd: Date): Date[] {
  const times: Date[] = [];
  const spacingMs = INTERVIEW_SLOT_SPACING_MINUTES * 60 * 1000;
  const lengthMs = INTERVIEW_SLOT_LENGTH_MINUTES * 60 * 1000;
  for (let t = windowStart.getTime(); t + lengthMs <= windowEnd.getTime(); t += spacingMs) {
    times.push(new Date(t));
  }
  return times;
}

export type CreateSlotsResult = { ok: true; created: number } | { ok: false; error: string };

// Admin-only: creates bookable slots for a date + time window. Skips any
// time that already has a non-cancelled slot (same window re-submitted
// twice shouldn't double-book the calendar).
export async function createInterviewSlots(
  db: Firestore,
  windowStart: Date,
  windowEnd: Date,
): Promise<CreateSlotsResult> {
  if (windowEnd <= windowStart) return { ok: false, error: "End time must be after start time." };
  const times = generateSlotTimes(windowStart, windowEnd);
  if (times.length === 0) {
    return { ok: false, error: "That window isn't long enough for a single slot." };
  }

  const existing = await db
    .collection("interviewSlots")
    .where("startTime", ">=", windowStart.toISOString())
    .where("startTime", "<", windowEnd.toISOString())
    .get();
  const existingTimes = new Set(
    existing.docs.filter((d) => d.data().status !== "cancelled").map((d) => d.data().startTime),
  );

  const batch = db.batch();
  let created = 0;
  const now = new Date().toISOString();
  for (const time of times) {
    const iso = time.toISOString();
    if (existingTimes.has(iso)) continue;
    const ref = db.collection("interviewSlots").doc();
    batch.set(ref, {
      startTime: iso,
      status: "open",
      meetingUrl: makeMeetingUrl(),
      createdAt: now,
    });
    created += 1;
  }
  if (created > 0) await batch.commit();
  return { ok: true, created };
}

export type BookSlotResult =
  | { ok: true; booking: InterviewBooking }
  | { ok: false; error: string };

// Books a slot for a job seeker inside a Firestore transaction, so two
// people clicking the same slot at the same moment can't both win it —
// the loser gets a clean "no longer available" rather than a silently
// overwritten booking. Also enforces one booking per seeker: rebooking
// isn't possible once a booking doc already exists for them (the admin
// cancelling/reopening a slot is the only way to let someone rebook —
// see cancelInterviewBooking).
export async function bookInterviewSlot(
  db: Firestore,
  uid: string,
  displayName: string,
  slotId: string,
): Promise<BookSlotResult> {
  const slotRef = db.collection("interviewSlots").doc(slotId);
  const bookingRef = db.collection("users").doc(uid).collection("interview").doc("booking");

  return db.runTransaction(async (tx) => {
    const [slotSnap, bookingSnap] = await Promise.all([tx.get(slotRef), tx.get(bookingRef)]);

    if (bookingSnap.exists && bookingSnap.data()?.outcome !== undefined) {
      const existingOutcome = bookingSnap.data()?.outcome;
      if (existingOutcome === "booked" || existingOutcome === "completed") {
        return { ok: false, error: "You already have an interview booked." };
      }
    }

    if (!slotSnap.exists) return { ok: false, error: "That slot no longer exists." };
    const slot = slotSnap.data() as InterviewSlot;
    if (slot.status !== "open") return { ok: false, error: "That slot has just been taken — pick another." };
    if (new Date(slot.startTime).getTime() <= Date.now()) {
      return { ok: false, error: "That slot is no longer in the future — pick another." };
    }

    const now = new Date().toISOString();
    tx.update(slotRef, {
      status: "booked",
      bookedByUid: uid,
      bookedByName: displayName,
      bookedAt: now,
    });

    const booking: InterviewBooking = {
      slotId,
      startTime: slot.startTime,
      meetingUrl: slot.meetingUrl,
      outcome: "booked",
      markedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    tx.set(bookingRef, booking);

    return { ok: true, booking };
  });
}

export type MarkOutcomeResult = { ok: true } | { ok: false; error: string };

// Admin-only: records what actually happened at the interview time.
// This — not the booking itself — is what the apply-gate checks, so a
// no-show never unlocks applying.
export async function markInterviewOutcome(
  db: Firestore,
  uid: string,
  outcome: "completed" | "no_show",
  adminEmail: string,
): Promise<MarkOutcomeResult> {
  const ref = db.collection("users").doc(uid).collection("interview").doc("booking");
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: "No booking found for this user." };
  if (snap.data()?.outcome === "completed") {
    return { ok: false, error: "Already marked completed." };
  }

  await ref.update({
    outcome,
    markedBy: adminEmail,
    markedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return { ok: true };
}

export type CancelBookingResult = { ok: true } | { ok: false; error: string };

// Admin-only: frees a slot back up and clears the seeker's booking doc
// entirely (not a status flip) so they land back on the slot picker and
// can choose a new time.
export async function cancelInterviewBooking(
  db: Firestore,
  uid: string,
): Promise<CancelBookingResult> {
  const bookingRef = db.collection("users").doc(uid).collection("interview").doc("booking");
  const bookingSnap = await bookingRef.get();
  if (!bookingSnap.exists) return { ok: false, error: "No booking found for this user." };

  const { slotId } = bookingSnap.data() as InterviewBooking;
  const batch = db.batch();
  batch.delete(bookingRef);
  if (slotId) {
    batch.update(db.collection("interviewSlots").doc(slotId), {
      status: "open",
      bookedByUid: null,
      bookedByName: null,
      bookedAt: null,
    });
  }
  await batch.commit();
  return { ok: true };
}
