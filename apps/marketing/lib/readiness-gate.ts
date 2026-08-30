import type { Firestore } from "firebase-admin/firestore";
import { gradeReadinessGateSubmission } from "./readiness-grading";
import { READINESS_GATE_QUESTIONS } from "./types";

export type SubmitReadinessGateResult =
  | { ok: true; outcome: "passed" | "flagged" }
  | { ok: false; error: string };

// Grades first — this is the real decision, not a best-effort side
// effect like an email send. If grading itself throws (bad API key,
// network failure, malformed response), fall back to "flagged for
// review" rather than losing the submission or silently auto-passing
// it. Writes the full submission doc in one non-merging set() — a
// resubmission after a rejection naturally clears any stale admin
// fields this way, since they're simply omitted from the new payload.
export async function writeReadinessGateSubmission(
  db: Firestore,
  uid: string,
  answers: [string, string, string],
): Promise<SubmitReadinessGateResult> {
  let aiVerdict: "pass" | "flag";
  let aiReasoning: string;
  try {
    const result = await gradeReadinessGateSubmission(answers);
    aiVerdict = result.verdict;
    aiReasoning = result.reasoning;
  } catch (err) {
    console.error("Readiness gate AI grading failed — falling back to flagged:", err);
    aiVerdict = "flag";
    aiReasoning = "Automatic review was unavailable — routed to manual review.";
  }

  const outcome = aiVerdict === "pass" ? "passed" : "flagged";
  const docRef = db.collection("users").doc(uid).collection("readinessGate").doc("submission");
  const now = new Date().toISOString();

  await docRef.set({
    answers: answers.map((answer, i) => ({ question: READINESS_GATE_QUESTIONS[i], answer })),
    aiVerdict,
    aiReasoning,
    outcome,
    adminReviewedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  return { ok: true, outcome };
}

export async function applyReadinessGateReview(
  db: Firestore,
  uid: string,
  decision: "approve" | "reject",
  reason: string | undefined,
  adminEmail: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const docRef = db.collection("users").doc(uid).collection("readinessGate").doc("submission");
  const snap = await docRef.get();
  if (!snap.exists || snap.data()?.outcome !== "flagged") {
    return { ok: false, error: "Submission is not currently flagged for review." };
  }
  if (decision === "reject" && !reason?.trim()) {
    return { ok: false, error: "A reason is required to reject." };
  }

  await docRef.update({
    outcome: decision === "approve" ? "passed" : "rejected",
    adminReviewedBy: adminEmail,
    ...(decision === "reject" ? { adminReason: reason!.trim() } : {}),
    adminReviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { ok: true };
}
