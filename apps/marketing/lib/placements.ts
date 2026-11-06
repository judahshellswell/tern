import type { Firestore, Timestamp } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { Placement, PricingPlan } from "./types";

export type RecordPlacementResult =
  | { ok: true; placement: Placement }
  | { ok: false; error: string };

// Creates the one permanent placement record for an application, the
// moment an employer marks it "hired" — see markApplicationHired in
// app/actions.ts for the caller. Idempotent on applicationId: calling
// this twice for the same application (e.g. a client retry) returns
// the existing placement rather than creating a second one or erroring,
// since "hired" is the kind of status an employer could plausibly
// re-select without meaning to create a new event.
export async function recordPlacement(
  db: Firestore,
  applicationId: string,
): Promise<RecordPlacementResult> {
  const placementRef = db.collection("placements").doc(applicationId);
  const existing = await placementRef.get();
  if (existing.exists) {
    const data = existing.data() as Omit<Placement, "createdAt"> & { createdAt: string | Timestamp };
    // A server action's return value crosses the server/client boundary
    // and must be a plain serializable object — the Firestore Timestamp
    // class this doc actually stores (via FieldValue.serverTimestamp())
    // isn't one, so it has to be converted to an ISO string here, same
    // as the freshly-created branch below already does.
    const createdAt = typeof data.createdAt === "string" ? data.createdAt : data.createdAt.toDate().toISOString();
    return { ok: true, placement: { ...data, createdAt } };
  }

  const appSnap = await db.collection("applications").doc(applicationId).get();
  const application = appSnap.data();
  if (!application) return { ok: false, error: "Application not found." };

  const employerSnap = await db.collection("users").doc(application.employerId).get();
  const employer = employerSnap.data();
  const pricingPlan: PricingPlan = employer?.pricingPlan ?? "trial";

  const now = new Date().toISOString();
  const placement: Placement = {
    id: applicationId,
    applicationId,
    jobId: application.jobId,
    jobTitle: application.jobTitle,
    employerId: application.employerId,
    employerName: application.employerName,
    applicantId: application.applicantId,
    applicantName: application.applicantName,
    ...(application.payMode !== undefined ? { payMode: application.payMode } : {}),
    ...(application.payMin !== undefined ? { payMin: application.payMin } : {}),
    ...(application.payMax !== undefined ? { payMax: application.payMax } : {}),
    pricingPlan,
    createdAt: now,
  };

  await placementRef.set({ ...placement, createdAt: FieldValue.serverTimestamp() });
  return { ok: true, placement };
}
