"use client";

import { useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { PRICING_PLAN_LABELS, type Placement } from "@/lib/types";
import { formatPay } from "@/lib/format";
import { useRetryingSnapshot } from "@/lib/use-retrying-snapshot";
import { deletePlacement } from "@/app/actions";
import { getIdToken } from "@/lib/id-token";

export function PlacementsList() {
  const [placements, setPlacements] = useState<Placement[] | null>(null);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(placement: Placement) {
    const confirmed = window.confirm(
      `Permanently delete the placement "${placement.applicantName} → ${placement.employerName}" (${placement.jobTitle})? This can't be undone.`,
    );
    if (!confirmed) return;
    setDeletingId(placement.id);
    const result = await deletePlacement(await getIdToken(), placement.id).catch(() => null);
    if (!result?.ok) {
      window.alert("Couldn't delete this placement. Please try again.");
    }
    setDeletingId(null);
  }

  useRetryingSnapshot(
    (onSuccess, onError) => {
      const q = query(collection(getClientFirestore(), "placements"), orderBy("createdAt", "desc"));
      return onSnapshot(
        q,
        (snap) => {
          setError("");
          setPlacements(snap.docs.map((d) => d.data() as Placement));
          onSuccess();
        },
        (err) => {
          setError("Couldn't load placements — retrying…");
          onError(err.message);
        },
      );
    },
    [],
  );

  if (error) {
    return <p className="text-gorse">{error}</p>;
  }

  if (placements === null) {
    return <p className="text-granite">Loading placements…</p>;
  }

  if (placements.length === 0) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 text-center">
        <p className="text-granite">No placements yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {placements.map((placement) => (
        <div key={placement.id} className="rounded-2xl border border-border-strong bg-paper-raised p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-serif text-lg font-semibold">
                {placement.applicantName} &rarr; {placement.employerName}
              </p>
              <p className="text-sm text-granite">{placement.jobTitle}</p>
            </div>
            <span className="rounded-full bg-tide/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-tide">
              {PRICING_PLAN_LABELS[placement.pricingPlan]}
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-sm text-granite-soft">{formatPay(placement)}</p>
            <button
              type="button"
              disabled={deletingId === placement.id}
              onClick={() => handleDelete(placement)}
              className="rounded-full bg-gorse px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {deletingId === placement.id ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
