"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { bookInterview } from "@/app/actions";
import { getIdToken } from "@/lib/id-token";
import type { InterviewBooking, InterviewSlot, ReadinessGateSubmission } from "@/lib/types";

export default function InterviewBookingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">Job seeker</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">Book your interview.</h1>
          <p className="mt-2 text-granite">
            A quick 15-minute call — the last step before you can apply. Pick a time that works
            for you below.
          </p>
          <div className="mt-8">
            <InterviewBooker />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function InterviewBooker() {
  const { user, profile, loading } = useAuth();
  const [readiness, setReadiness] = useState<ReadinessGateSubmission | null | undefined>(undefined);
  const [booking, setBooking] = useState<InterviewBooking | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    const ref = doc(getClientFirestore(), "users", user.uid, "readinessGate", "submission");
    return onSnapshot(ref, (snap) => {
      setReadiness(snap.exists() ? (snap.data() as ReadinessGateSubmission) : null);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(getClientFirestore(), "users", user.uid, "interview", "booking");
    return onSnapshot(ref, (snap) => {
      setBooking(snap.exists() ? (snap.data() as InterviewBooking) : null);
    });
  }, [user]);

  if (loading || readiness === undefined || booking === undefined) {
    return <p className="text-granite">Loading…</p>;
  }

  if (!user || !profile) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">You need to be logged in to see this page.</p>
        <Link href="/log-in" className="mt-3 inline-block font-medium text-tide underline">
          Log in
        </Link>
      </div>
    );
  }

  if (profile.role !== "job_seeker") {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">Only job seeker accounts need to book an interview.</p>
      </div>
    );
  }

  if (readiness?.outcome !== "passed") {
    return (
      <div className="rounded-2xl border border-border-strong bg-gorse-bg p-6">
        <p className="font-semibold text-gorse">Complete your readiness check first</p>
        <p className="mt-1 text-sm text-granite">
          You&rsquo;ll be able to book an interview once your readiness answers are approved.
        </p>
        <Link href="/dashboard/readiness" className="mt-3 inline-block font-medium text-tide underline">
          Go to readiness check
        </Link>
      </div>
    );
  }

  if (booking?.outcome === "completed") {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 text-center">
        <p className="font-serif text-lg font-semibold text-tide">You&rsquo;re all set.</p>
        <p className="mt-1 text-sm text-granite">Your interview is complete — you can apply to jobs now.</p>
        <Link
          href="/jobs"
          className="mt-4 inline-block rounded-full bg-tide px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright"
        >
          Browse jobs
        </Link>
      </div>
    );
  }

  if (booking?.outcome === "booked") {
    return <BookedState booking={booking} />;
  }

  return <SlotPicker />;
}

function BookedState({ booking }: { booking: InterviewBooking }) {
  const start = new Date(booking.startTime);
  const joinableFrom = new Date(start.getTime() - 15 * 60 * 1000);
  const now = useNow();
  const canJoin = now >= joinableFrom;

  return (
    <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">Interview booked</p>
      <p className="mt-3 font-serif text-2xl font-semibold tracking-tight">
        {start.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <p className="mt-1 text-lg text-granite">
        {start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </p>
      {canJoin ? (
        <a
          href={booking.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright"
        >
          Join call →
        </a>
      ) : (
        <p className="mt-6 text-sm text-granite">
          The join link opens 15 minutes before your slot.
        </p>
      )}
      <p className="mt-4 text-xs text-granite-soft">
        Need to change this? Email{" "}
        <a href="mailto:hello@tern.je" className="text-tide underline">
          hello@tern.je
        </a>{" "}
        and we&rsquo;ll sort it.
      </p>
    </div>
  );
}

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function SlotPicker() {
  const [slots, setSlots] = useState<InterviewSlot[] | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nowIso = new Date().toISOString();
    const q = query(
      collection(getClientFirestore(), "interviewSlots"),
      where("status", "==", "open"),
      where("startTime", ">", nowIso),
      orderBy("startTime", "asc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InterviewSlot));
      },
      (err) => {
        console.error("Interview slots listener failed:", err);
        setError("Couldn't load available times. Please refresh the page.");
      },
    );
    return unsubscribe;
  }, []);

  const slotsByDay = useMemo(() => {
    const groups = new Map<string, InterviewSlot[]>();
    for (const slot of slots ?? []) {
      const key = new Date(slot.startTime).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const existing = groups.get(key) ?? [];
      existing.push(slot);
      groups.set(key, existing);
    }
    return groups;
  }, [slots]);

  async function handleBook(slotId: string) {
    setError("");
    setIsPending(true);
    setSelectedSlotId(slotId);
    try {
      const result = await bookInterview(await getIdToken(), slotId);
      if (!result.ok) {
        setError(result.error);
        setSelectedSlotId(null);
      }
    } catch {
      setError("Couldn't book that slot. Please try again.");
      setSelectedSlotId(null);
    } finally {
      setIsPending(false);
    }
  }

  if (slots === null) {
    return <p className="text-granite">Loading available times…</p>;
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">
          No interview slots are open right now — check back soon, or email{" "}
          <a href="mailto:hello@tern.je" className="text-tide underline">
            hello@tern.je
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {[...slotsByDay.entries()].map(([day, daySlots]) => (
        <div key={day} className="rounded-2xl border border-border-strong bg-paper-raised p-5 sm:p-6">
          <p className="font-serif text-base font-semibold">{day}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {daySlots.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleBook(slot.id)}
                  className="rounded-xl border border-border-strong bg-paper px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-tide hover:bg-tide-bg disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {isPending && isSelected
                    ? "…"
                    : new Date(slot.startTime).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {error && (
        <p role="alert" className="text-sm text-gorse">
          {error}
        </p>
      )}
    </div>
  );
}
