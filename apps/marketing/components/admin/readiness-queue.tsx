"use client";

import { useEffect, useState } from "react";
import { collectionGroup, onSnapshot, query, where } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import type { ReadinessGateSubmission } from "@/lib/types";
import { reviewReadinessGate } from "@/app/actions";
import { ReasonForm } from "@/components/admin/reason-form";

type FlaggedSubmission = ReadinessGateSubmission & { uid: string };

export function ReadinessQueue() {
  const [flagged, setFlagged] = useState<FlaggedSubmission[] | null>(null);
  const [activeReject, setActiveReject] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(
      collectionGroup(getClientFirestore(), "readinessGate"),
      where("outcome", "==", "flagged"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setError("");
        setFlagged(
          snap.docs.map((d) => ({
            ...(d.data() as ReadinessGateSubmission),
            uid: d.ref.parent.parent!.id,
          })),
        );
      },
      (err) => {
        console.error("Readiness queue listener failed:", err);
        setError("Couldn't load the readiness queue. Please refresh the page.");
      },
    );
    return unsubscribe;
  }, []);

  if (error) {
    return <p className="text-gorse">{error}</p>;
  }

  async function approve(uid: string) {
    await reviewReadinessGate(uid, "approve");
  }

  async function reject(uid: string, reason: string) {
    await reviewReadinessGate(uid, "reject", reason);
    setActiveReject(null);
  }

  if (flagged === null) {
    return <p className="text-granite">Loading queue…</p>;
  }

  if (flagged.length === 0) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 text-center">
        <p className="text-granite">Nothing flagged for review.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {flagged.map((submission) => (
        <div key={submission.uid} className="rounded-2xl border border-border-strong bg-paper-raised p-5">
          <p className="font-mono text-[10px] uppercase tracking-wide text-granite-soft">
            Flagged by AI &middot; {submission.aiReasoning}
          </p>
          <dl className="mt-3 flex flex-col gap-3">
            {submission.answers.map((qa, i) => (
              <div key={i}>
                <dt className="text-xs text-granite-soft">{qa.question}</dt>
                <dd className="mt-0.5 text-sm text-ink">{qa.answer}</dd>
              </div>
            ))}
          </dl>

          {activeReject === submission.uid ? (
            <ReasonForm
              kind="readiness_reject"
              onCancel={() => setActiveReject(null)}
              onConfirm={(reason) => reject(submission.uid, reason)}
            />
          ) : (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => approve(submission.uid)}
                className="rounded-full bg-tide px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright cursor-pointer"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setActiveReject(submission.uid)}
                className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-gorse hover:text-gorse cursor-pointer"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
