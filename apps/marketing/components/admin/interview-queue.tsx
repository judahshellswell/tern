"use client";

import { useEffect, useState } from "react";
import { collectionGroup, onSnapshot, query, where } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { setInterviewOutcome, cancelInterview } from "@/app/actions";
import { getIdToken } from "@/lib/id-token";
import type { InterviewBooking } from "@/lib/types";
import { useRetryingSnapshot } from "@/lib/use-retrying-snapshot";

type QueuedBooking = InterviewBooking & { uid: string };

export function InterviewQueue() {
  const [bookings, setBookings] = useState<QueuedBooking[] | null>(null);
  const [error, setError] = useState("");
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useRetryingSnapshot(
    (onSuccess, onError) => {
      const q = query(collectionGroup(getClientFirestore(), "interview"), where("outcome", "==", "booked"));
      return onSnapshot(
        q,
        (snap) => {
          setError("");
          setBookings(
            snap.docs
              .map((d) => ({ ...(d.data() as InterviewBooking), uid: d.ref.parent.parent!.id }))
              .sort((a, b) => a.startTime.localeCompare(b.startTime)),
          );
          onSuccess();
        },
        (err) => {
          setError("Couldn't load booked interviews — retrying…");
          onError(err.message);
        },
      );
    },
    [],
  );

  async function markOutcome(uid: string, outcome: "completed" | "no_show") {
    setPendingUid(uid);
    try {
      await setInterviewOutcome(await getIdToken(), uid, outcome);
    } finally {
      setPendingUid(null);
    }
  }

  async function cancel(uid: string) {
    setPendingUid(uid);
    try {
      await cancelInterview(await getIdToken(), uid);
    } finally {
      setPendingUid(null);
    }
  }

  if (error) {
    return <p className="text-gorse">{error}</p>;
  }

  if (bookings === null) {
    return <p className="text-granite">Loading…</p>;
  }

  if (bookings.length === 0) {
    return <p className="text-granite">No interviews currently booked.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {bookings.map((booking) => {
        const start = new Date(booking.startTime);
        const isPast = start.getTime() < now;
        const isPending = pendingUid === booking.uid;
        return (
          <li
            key={booking.uid}
            className="rounded-2xl border border-border-strong bg-paper-raised p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-base font-semibold">
                  {start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  {" · "}
                  {start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="mt-0.5 text-xs text-granite-soft">{booking.uid}</p>
              </div>
              <a
                href={booking.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-tide underline"
              >
                Join link
              </a>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => markOutcome(booking.uid, "completed")}
                className="rounded-full bg-tide px-4 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer"
              >
                Mark completed
              </button>
              <button
                type="button"
                disabled={isPending || !isPast}
                title={!isPast ? "Can't mark a no-show before the slot time" : undefined}
                onClick={() => markOutcome(booking.uid, "no_show")}
                className="rounded-full border border-border-strong px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-gorse disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                No-show
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => cancel(booking.uid)}
                className="rounded-full border border-border-strong px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-gorse disabled:opacity-60 cursor-pointer"
              >
                Cancel / free slot
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
