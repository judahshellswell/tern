"use client";

import { useState } from "react";
import { collectionGroup, onSnapshot, query, where } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import type { ChatMessage } from "@/lib/types";
import { reviewFlaggedMessage, reopenConversation } from "@/app/actions";
import { getIdToken } from "@/lib/id-token";
import { useRetryingSnapshot } from "@/lib/use-retrying-snapshot";

type FlaggedMessage = ChatMessage & { applicationId: string };

export function FlaggedMessagesQueue() {
  const [flagged, setFlagged] = useState<FlaggedMessage[] | null>(null);
  const [error, setError] = useState("");

  useRetryingSnapshot(
    (onSuccess, onError) => {
      const q = query(
        collectionGroup(getClientFirestore(), "messages"),
        where("flagged", "==", true),
      );
      return onSnapshot(
        q,
        (snap) => {
          setError("");
          setFlagged(
            snap.docs
              .map((d) => ({ ...(d.data() as ChatMessage), applicationId: d.ref.parent.parent!.id }))
              .filter((m) => !m.reviewed),
          );
          onSuccess();
        },
        (err) => {
          setError("Couldn't load the flagged-messages queue — retrying…");
          onError(err.message);
        },
      );
    },
    [],
  );

  if (error) {
    return <p className="text-gorse">{error}</p>;
  }

  async function markReviewed(message: FlaggedMessage) {
    await reviewFlaggedMessage(await getIdToken(), message.applicationId, message.id);
  }

  async function unfreeze(message: FlaggedMessage) {
    await reopenConversation(await getIdToken(), message.applicationId);
  }

  if (flagged === null) {
    return <p className="text-granite">Loading queue…</p>;
  }

  if (flagged.length === 0) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 text-center">
        <p className="text-granite">Nothing flagged.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {flagged.map((message) => (
        <div key={`${message.applicationId}-${message.id}`} className="rounded-2xl border border-border-strong bg-paper-raised p-5">
          <p className="font-mono text-[10px] uppercase tracking-wide text-gorse">
            Flagged &middot; sent by {message.senderRole === "employer" ? "employer" : "job seeker"}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{message.body}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => markReviewed(message)}
              className="rounded-full bg-tide px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright cursor-pointer"
            >
              Mark reviewed
            </button>
            <button
              type="button"
              onClick={() => unfreeze(message)}
              className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-tide cursor-pointer"
            >
              Unfreeze conversation
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
