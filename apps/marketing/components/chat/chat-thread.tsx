"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { openConversation, sendMessage, setMessageBlock } from "@/app/actions";
import { getIdToken } from "@/lib/id-token";
import { ReportButton } from "@/components/reports/report-button";
import type { ChatMessage, Conversation } from "@/lib/types";

export function ChatThread({
  applicationId,
  viewerUid,
  readOnly = false,
}: {
  applicationId: string;
  viewerUid: string;
  // Admin viewing via the flagged-messages queue / report detail —
  // viewerUid isn't a party to the conversation, so sending, blocking
  // and opening (which all require being employer/applicant) are
  // skipped entirely; this view is read-only history.
  readOnly?: boolean;
}) {
  const [conversation, setConversation] = useState<Conversation | null | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  // readOnly (admin) viewers skip openConversation entirely and read an
  // already-existing conversation straight away; everyone else must wait
  // for openConversation to resolve before the listeners below attach —
  // otherwise they can race the server action that creates the
  // conversations/{applicationId} doc, and the Firestore rules (which
  // key off resource.data on that doc) reject a snapshot of a doc that
  // doesn't exist yet with permission-denied rather than "not found".
  const [readyToListen, setReadyToListen] = useState(readOnly);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Opens (or lazily creates) the conversation once on mount — this is
  // a server action, not a client Firestore write, since conversation
  // creation needs the Admin SDK to read the application doc and
  // denormalize its fields (see getOrCreateConversation).
  useEffect(() => {
    if (readOnly) return;
    let cancelled = false;
    getIdToken()
      .then((token) => openConversation(token, applicationId))
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setReadyToListen(true);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't open this conversation.");
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId, readOnly]);

  useEffect(() => {
    if (!readyToListen) return;
    const unsubscribe: Unsubscribe = onSnapshot(
      doc(getClientFirestore(), "conversations", applicationId),
      (snap) => setConversation(snap.exists() ? ({ id: snap.id, ...snap.data() } as Conversation) : null),
      () => setConversation(null),
    );
    return unsubscribe;
  }, [applicationId, readyToListen]);

  useEffect(() => {
    if (!readyToListen) return;
    const q = query(
      collection(getClientFirestore(), "conversations", applicationId, "messages"),
      orderBy("createdAt", "asc"),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data() as ChatMessage));
    });
    return unsubscribe;
  }, [applicationId, readyToListen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || isSending) return;
    setIsSending(true);
    setError("");
    try {
      const token = await getIdToken();
      const result = await sendMessage(token, applicationId, body);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft("");
    } catch {
      setError("Couldn't send that message. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  async function toggleBlock(blocked: boolean) {
    try {
      const token = await getIdToken();
      await setMessageBlock(token, applicationId, blocked);
    } catch {
      setError("Couldn't update that. Please try again.");
    }
  }

  if (conversation === undefined) {
    return <p className="text-granite">Loading…</p>;
  }

  if (conversation === null) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">That conversation couldn&rsquo;t be found.</p>
      </div>
    );
  }

  const isParty = viewerUid === conversation.employerId || viewerUid === conversation.applicantId;
  const otherName = viewerUid === conversation.employerId ? conversation.applicantName : conversation.employerName;
  const iBlocked = isParty && conversation.blockedBy.includes(viewerUid);
  const theyBlocked = isParty && conversation.blockedBy.some((uid) => uid !== viewerUid);
  const canSend = isParty && !conversation.frozen && conversation.blockedBy.length === 0;
  const otherRole = viewerUid === conversation.employerId ? "job_seeker" : "employer";
  const otherUid = viewerUid === conversation.employerId ? conversation.applicantId : conversation.employerId;

  return (
    <div className="rounded-2xl border border-border-strong bg-paper-raised">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="font-serif text-lg font-semibold">
            {readOnly ? `${conversation.applicantName} ↔ ${conversation.employerName}` : otherName}
          </p>
          <p className="text-xs text-granite-soft">{conversation.jobTitle}</p>
        </div>
        {isParty && (
          <button
            type="button"
            onClick={() => toggleBlock(!iBlocked)}
            className="text-xs font-medium text-granite-soft underline hover:text-gorse cursor-pointer"
          >
            {iBlocked ? "Unblock" : "Block"}
          </button>
        )}
      </div>

      <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-granite-soft">No messages yet — say hello.</p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              message.senderId === viewerUid
                ? "self-end bg-tide text-paper"
                : "self-start bg-paper text-ink"
            }`}
          >
            {message.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!readOnly && isParty && (
        <div className="border-t border-border px-5 py-4">
          {conversation.frozen && (
            <p className="mb-3 rounded-lg bg-gorse-bg px-3 py-2 text-xs text-gorse">
              This conversation is under review and can&rsquo;t receive new messages right now.
            </p>
          )}
          {!conversation.frozen && (iBlocked || theyBlocked) && (
            <p className="mb-3 rounded-lg bg-gorse-bg px-3 py-2 text-xs text-gorse">
              {iBlocked
                ? "You've blocked this conversation — unblock to send messages again."
                : "Messaging is unavailable right now."}
            </p>
          )}
          <form onSubmit={handleSend} className="flex gap-2">
            <label className="sr-only" htmlFor="chat-draft">
              Message
            </label>
            <input
              id="chat-draft"
              type="text"
              value={draft}
              disabled={!canSend || isSending}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
              className="flex-1 rounded-full border border-border-strong bg-paper px-5 py-2.5 text-sm text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!canSend || isSending || !draft.trim()}
              className="rounded-full bg-tide px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-2 text-sm text-gorse">
              {error}
            </p>
          )}
          <div className="mt-3">
            <ReportButton
              reporterRole={otherRole === "employer" ? "job_seeker" : "employer"}
              reportedId={otherUid}
              reportedRole={otherRole}
              conversationId={applicationId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
