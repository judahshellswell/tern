import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { moderateMessage } from "./message-moderation";
import type { ChatMessage, UserRole } from "./types";

const MAX_MESSAGE_LENGTH = 4000;

export type GetOrCreateConversationResult =
  | { ok: true; created: boolean }
  | { ok: false; error: string };

// A conversation's id is always its application's id — see the
// Conversation type comment in lib/types.ts for why. Called lazily
// (first time either party opens the chat for an application) rather
// than at application-creation time, so a seeker who never opens chat
// never gets an empty conversation doc cluttering the collection.
export async function getOrCreateConversation(
  db: Firestore,
  applicationId: string,
  callerUid: string,
): Promise<GetOrCreateConversationResult> {
  const appSnap = await db.collection("applications").doc(applicationId).get();
  const application = appSnap.data();
  if (!application) return { ok: false, error: "Application not found." };
  if (callerUid !== application.employerId && callerUid !== application.applicantId) {
    return { ok: false, error: "Not authorized." };
  }

  const convoRef = db.collection("conversations").doc(applicationId);
  const convoSnap = await convoRef.get();
  if (convoSnap.exists) return { ok: true, created: false };

  await convoRef.set({
    applicationId,
    jobId: application.jobId,
    jobTitle: application.jobTitle,
    employerId: application.employerId,
    employerName: application.employerName,
    applicantId: application.applicantId,
    applicantName: application.applicantName,
    blockedBy: [],
    frozen: false,
    lastMessageAt: null,
    lastReadByEmployer: null,
    lastReadByApplicant: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { ok: true, created: true };
}

export type MarkReadResult = { ok: true } | { ok: false; error: string };

// Called when a party opens a conversation — stamps their own
// last-read field so the unread badges on the applications list
// (seeker) and applicant board (employer) clear immediately.
export async function markConversationRead(
  db: Firestore,
  applicationId: string,
  callerUid: string,
): Promise<MarkReadResult> {
  const convoRef = db.collection("conversations").doc(applicationId);
  const convoSnap = await convoRef.get();
  const conversation = convoSnap.data();
  if (!conversation) return { ok: false, error: "Conversation not found." };
  if (callerUid !== conversation.employerId && callerUid !== conversation.applicantId) {
    return { ok: false, error: "Not authorized." };
  }

  const now = new Date().toISOString();
  const field = callerUid === conversation.employerId ? "lastReadByEmployer" : "lastReadByApplicant";
  await convoRef.update({ [field]: now });
  return { ok: true };
}

export type SendMessageResult =
  | { ok: true; message: ChatMessage }
  | { ok: false; error: string };

export async function sendChatMessage(
  db: Firestore,
  applicationId: string,
  senderId: string,
  senderRole: UserRole,
  body: string,
): Promise<SendMessageResult> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Message can't be empty." };
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: "Message is too long." };
  }

  const convoRef = db.collection("conversations").doc(applicationId);
  const convoSnap = await convoRef.get();
  const conversation = convoSnap.data();
  if (!conversation) return { ok: false, error: "Conversation not found." };
  if (senderId !== conversation.employerId && senderId !== conversation.applicantId) {
    return { ok: false, error: "Not authorized." };
  }
  if (conversation.frozen) {
    return { ok: false, error: "This conversation is under review and can't receive new messages." };
  }
  const blockedBy: string[] = conversation.blockedBy ?? [];
  if (blockedBy.length > 0) {
    return { ok: false, error: "Messaging is unavailable — one side has blocked the other." };
  }

  const { flagged } = moderateMessage(trimmed);
  const now = new Date().toISOString();
  const messageRef = convoRef.collection("messages").doc();
  const message: ChatMessage = {
    id: messageRef.id,
    senderId,
    senderRole,
    body: trimmed,
    flagged,
    createdAt: now,
  };

  const readField = senderId === conversation.employerId ? "lastReadByEmployer" : "lastReadByApplicant";

  await messageRef.set(message);
  await convoRef.update({ lastMessageAt: now, [readField]: now });

  return { ok: true, message };
}

export type SetBlockResult = { ok: true } | { ok: false; error: string };

export async function setConversationBlock(
  db: Firestore,
  applicationId: string,
  callerUid: string,
  blocked: boolean,
): Promise<SetBlockResult> {
  const convoRef = db.collection("conversations").doc(applicationId);
  const convoSnap = await convoRef.get();
  const conversation = convoSnap.data();
  if (!conversation) return { ok: false, error: "Conversation not found." };
  if (callerUid !== conversation.employerId && callerUid !== conversation.applicantId) {
    return { ok: false, error: "Not authorized." };
  }

  await convoRef.update({
    blockedBy: blocked ? FieldValue.arrayUnion(callerUid) : FieldValue.arrayRemove(callerUid),
  });
  return { ok: true };
}

export async function freezeConversation(db: Firestore, applicationId: string): Promise<void> {
  await db.collection("conversations").doc(applicationId).update({ frozen: true });
}

export type ReviewResult = { ok: true } | { ok: false; error: string };

// Admin-only: clears a flagged message from the queue. There's no real
// verdict to apply to a single message (unlike readinessGate's
// approve/reject) — this just marks it looked at.
export async function markMessageReviewed(
  db: Firestore,
  applicationId: string,
  messageId: string,
): Promise<ReviewResult> {
  const ref = db.collection("conversations").doc(applicationId).collection("messages").doc(messageId);
  if (!(await ref.get()).exists) return { ok: false, error: "Message not found." };
  await ref.update({ reviewed: true });
  return { ok: true };
}

export type UnfreezeResult = { ok: true } | { ok: false; error: string };

// Admin-only: resolving a report tied to a conversation unfreezes it
// again so the two parties can keep talking (the report itself is
// still kept as a permanent record either way — see reports/{id}).
export async function unfreezeConversation(
  db: Firestore,
  applicationId: string,
): Promise<UnfreezeResult> {
  const ref = db.collection("conversations").doc(applicationId);
  if (!(await ref.get()).exists) return { ok: false, error: "Conversation not found." };
  await ref.update({ frozen: false });
  return { ok: true };
}
