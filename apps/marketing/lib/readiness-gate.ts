import type { Firestore } from "firebase-admin/firestore";
import { gradeReadinessGateSubmission, type FreeTextAnswer } from "./readiness-grading";
import { READINESS_ANSWER_KEY } from "./readiness-answer-key";
import { READINESS_COURSE, READINESS_MC_MAX_WRONG, type ReadinessSectionResult } from "./types";

export type SubmitReadinessGateResult =
  | { ok: true; outcome: "passed" | "flagged" }
  | { ok: false; error: string };

// Raw client submission: for each section, the seeker's answer per
// item id — a free-text string, or the selected option index. Scored
// and re-shaped into ReadinessSectionResult server-side against
// READINESS_COURSE/READINESS_ANSWER_KEY, never trusted as-is — the
// client only ever supplies raw answers, never a `correct` verdict.
export type ReadinessRawAnswers = Record<string, string | number>;

// Grades first — this is the real decision, not a best-effort side
// effect like an email send. Multiple-choice items are scored
// deterministically against READINESS_ANSWER_KEY; free-text items are
// batched into a single Claude call. If grading itself throws (bad API
// key, network failure, malformed response), fall back to "flagged for
// review" rather than losing the submission or silently auto-passing
// it. A flag from either the MC threshold or the AI verdict is enough
// to route to review — they're kept independent so an admin can see
// which side actually caused the flag rather than one masking the
// other. Writes the full submission doc in one non-merging set() — a
// resubmission after a rejection naturally clears any stale admin
// fields this way, since they're simply omitted from the new payload.
export async function writeReadinessGateSubmission(
  db: Firestore,
  uid: string,
  rawAnswers: ReadinessRawAnswers,
): Promise<SubmitReadinessGateResult> {
  const sections: ReadinessSectionResult[] = [];
  const freeTextAnswers: FreeTextAnswer[] = [];
  let mcCorrectCount = 0;
  let mcTotalCount = 0;

  for (const section of READINESS_COURSE) {
    const answers = section.items.map((item) => {
      if (item.type === "free_text") {
        const answer = String(rawAnswers[item.id] ?? "");
        freeTextAnswers.push({ prompt: item.prompt, answer });
        return { itemId: item.id, prompt: item.prompt, type: item.type, answer };
      }

      const selectedIndex = Number(rawAnswers[item.id]);
      const correct = READINESS_ANSWER_KEY[item.id] === selectedIndex;
      mcTotalCount += 1;
      if (correct) mcCorrectCount += 1;
      return { itemId: item.id, prompt: item.prompt, type: item.type, selectedIndex, correct };
    });
    sections.push({ sectionId: section.id, sectionTitle: section.title, answers });
  }

  let aiVerdict: "pass" | "flag";
  let aiReasoning: string;
  try {
    const result = await gradeReadinessGateSubmission(freeTextAnswers);
    aiVerdict = result.verdict;
    aiReasoning = result.reasoning;
  } catch (err) {
    console.error("Readiness gate AI grading failed — falling back to flagged:", err);
    aiVerdict = "flag";
    aiReasoning = "Automatic review was unavailable — routed to manual review.";
  }

  const mcFlag = mcCorrectCount < mcTotalCount - READINESS_MC_MAX_WRONG;
  const outcome = aiVerdict === "flag" || mcFlag ? "flagged" : "passed";
  const docRef = db.collection("users").doc(uid).collection("readinessGate").doc("submission");
  const now = new Date().toISOString();

  await docRef.set({
    sections,
    mcCorrectCount,
    mcTotalCount,
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
