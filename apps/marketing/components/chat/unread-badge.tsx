"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import type { Conversation } from "@/lib/types";

// Shown next to an application (seeker's applied-jobs list) or an
// applicant (employer's board) when the other party has sent a message
// since the viewer last opened that conversation. Reads only the
// conversation doc, not its messages subcollection, so it's cheap to
// mount once per row.
export function UnreadBadge({
  applicationId,
  viewerRole,
}: {
  applicationId: string;
  viewerRole: "job_seeker" | "employer";
}) {
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(getClientFirestore(), "conversations", applicationId),
      (snap) => setConversation(snap.exists() ? (snap.data() as Conversation) : null),
      () => setConversation(null),
    );
    return unsubscribe;
  }, [applicationId]);

  if (!conversation || !conversation.lastMessageAt) return null;

  const lastRead = viewerRole === "job_seeker" ? conversation.lastReadByApplicant : conversation.lastReadByEmployer;
  const unread = !lastRead || lastRead < conversation.lastMessageAt;
  if (!unread) return null;

  return (
    <span className="rounded-full bg-gorse px-2.5 py-0.5 text-xs font-semibold text-paper">
      Unread message
    </span>
  );
}
