"use client";

import { useState } from "react";
import { addInterviewAvailability } from "@/app/actions";
import { getIdToken } from "@/lib/id-token";
import { INTERVIEW_SLOT_LENGTH_MINUTES, INTERVIEW_SLOT_SPACING_MINUTES } from "@/lib/types";

// Admin picks a date plus a start/end time — the server generates the
// actual bookable slots from that window (see lib/interview-gate.ts),
// spaced INTERVIEW_SLOT_SPACING_MINUTES apart so a slot can never be
// hand-placed into an overlapping time.
export function InterviewAvailability() {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
      setMessage({ kind: "error", text: "Fill in a date, start time, and end time." });
      return;
    }
    const windowStart = new Date(`${date}T${startTime}:00`);
    const windowEnd = new Date(`${date}T${endTime}:00`);
    setIsPending(true);
    setMessage(null);
    try {
      const result = await addInterviewAvailability(
        await getIdToken(),
        windowStart.toISOString(),
        windowEnd.toISOString(),
      );
      if (!result.ok) {
        setMessage({ kind: "error", text: result.error });
      } else {
        setMessage({
          kind: "ok",
          text:
            result.created > 0
              ? `Added ${result.created} new slot${result.created === 1 ? "" : "s"}.`
              : "Those times were already covered — nothing new added.",
        });
        setStartTime("");
        setEndTime("");
      }
    } catch {
      setMessage({ kind: "error", text: "Couldn't add availability. Please try again." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-strong bg-paper-raised p-5 sm:p-6"
    >
      <p className="text-sm text-granite">
        Add a date and time window — slots are generated automatically,{" "}
        {INTERVIEW_SLOT_LENGTH_MINUTES} minutes each, {INTERVIEW_SLOT_SPACING_MINUTES} minutes
        apart.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="interview-date" className="mb-1 block text-xs font-medium text-granite">
            Date
          </label>
          <input
            id="interview-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border-strong bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-tide"
          />
        </div>
        <div>
          <label htmlFor="interview-start" className="mb-1 block text-xs font-medium text-granite">
            Start time
          </label>
          <input
            id="interview-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-xl border border-border-strong bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-tide"
          />
        </div>
        <div>
          <label htmlFor="interview-end" className="mb-1 block text-xs font-medium text-granite">
            End time
          </label>
          <input
            id="interview-end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-xl border border-border-strong bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-tide"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 rounded-full bg-tide px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer"
      >
        {isPending ? "Adding…" : "Add availability"}
      </button>
      {message && (
        <p role="status" className={`mt-3 text-sm ${message.kind === "error" ? "text-gorse" : "text-tide"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
