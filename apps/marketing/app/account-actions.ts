"use server";

import { FieldValue, type Query } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore, getAdminStorageBucket } from "@/lib/firebase-admin";
import { requireAdmin, requireUser } from "@/lib/server-auth";
import { isAdminEmail, isDemoEmail } from "@/lib/admin";
import { cvStoragePath } from "@/lib/cv-path";

// Every export here is a publicly callable endpoint — each one checks the
// caller's identity itself before touching any data.

const DELETED_USER_LABEL = "Deleted user";
const CV_LINK_TTL_MS = 10 * 60 * 1000;

// ---------------------------------------------------------------- CVs

// Short-lived download link for an applicant's CV, only for an employer
// the applicant has actually applied to (same check as
// getApplicantProfileForEmployer in app/actions.ts).
export async function getApplicantCvUrl(
  idToken: string,
  applicantId: string,
): Promise<{ url: string; name: string } | null> {
  const caller = await requireUser(idToken).catch(() => null);
  if (!caller || typeof applicantId !== "string" || !applicantId) return null;

  const applicationsSnap = await getAdminFirestore()
    .collection("applications")
    .where("employerId", "==", caller.uid)
    .where("applicantId", "==", applicantId)
    .limit(1)
    .get();
  if (applicationsSnap.empty) return null;

  const file = (await getAdminStorageBucket()).file(cvStoragePath(applicantId));
  const [exists] = await file.exists();
  if (!exists) return null;

  const [metadata] = await file.getMetadata();
  const name = (metadata.metadata?.originalName as string | undefined) ?? "CV";
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + CV_LINK_TTL_MS,
    responseDisposition: `attachment; filename="${name.replace(/["\\\r\n]/g, "")}"`,
  });
  return { url, name };
}

// ------------------------------------------------------- ID documents

// ID documents are only kept until the admin has made a verification
// decision (approve, reject or ban) — then they're deleted. Only the
// outcome is kept on the profile. A rejected user who resubmits uploads a
// fresh document through the normal resubmit flow.
export async function deleteReviewedIdDocument(
  idToken: string,
  uid: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin(idToken);
  } catch {
    return { ok: false, error: "Admin only." };
  }
  if (typeof uid !== "string" || !uid) return { ok: false, error: "Missing user." };

  await (await getAdminStorageBucket()).deleteFiles({ prefix: `verification-ids/${uid}/` });
  await getAdminFirestore()
    .collection("users")
    .doc(uid)
    .update({ idDocumentDeletedAt: new Date().toISOString() })
    .catch(() => {
      // Profile may already be gone — the file deletion is what matters.
    });
  return { ok: true };
}

// --------------------------------------------------- Account deletion

// Self-serve, permanent account deletion. Removes the sign-in account,
// the profile and everything under it, all uploaded files, applications,
// chats and (for employers) their jobs. Records that must be kept for a
// limited time — reports (safety) and placements (billing/tax) — are kept
// but have the person's name removed. Runs data removal first and the
// sign-in account last, so a failure part-way can simply be retried.
export async function deleteMyAccount(
  idToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const caller = await requireUser(idToken).catch(() => null);
  if (!caller) return { ok: false, error: "Please log in again and retry." };
  if (isAdminEmail(caller.email)) {
    return { ok: false, error: "The admin account can't be deleted from here." };
  }
  if (isDemoEmail(caller.email)) {
    return { ok: false, error: "This is a shared demo account and can't be deleted." };
  }

  const uid = caller.uid;
  const db = getAdminFirestore();
  const userRef = db.collection("users").doc(uid);
  const profile = (await userRef.get()).data();

  if (profile?.verificationStatus === "banned" || profile?.verificationStatus === "suspended") {
    return {
      ok: false,
      error: "This account is under review and can't be deleted right now.",
    };
  }

  try {
    const role = profile?.role as "job_seeker" | "employer" | undefined;
    const ownField = role === "employer" ? "employerId" : "applicantId";

    // Chats (and their messages) this person is part of.
    const conversations = await db.collection("conversations").where(ownField, "==", uid).get();
    for (const convo of conversations.docs) {
      await db.recursiveDelete(convo.ref);
    }

    // Applications they made (job seeker) or received (employer).
    await deleteQuery(db.collection("applications").where(ownField, "==", uid));

    // An employer's job listings.
    if (role === "employer") {
      await deleteQuery(db.collection("jobs").where("employerId", "==", uid));
    }

    // Interview slots they booked: free up future ones, anonymise past ones.
    const slots = await db.collection("interviewSlots").where("bookedByUid", "==", uid).get();
    const now = Date.now();
    for (const slot of slots.docs) {
      const isFuture = new Date(slot.data().startTime).getTime() > now;
      await slot.ref.update(
        isFuture
          ? {
              status: "open",
              bookedByUid: FieldValue.delete(),
              bookedByName: FieldValue.delete(),
              bookedAt: FieldValue.delete(),
            }
          : { bookedByUid: FieldValue.delete(), bookedByName: DELETED_USER_LABEL },
      );
    }

    // Placements are billing records kept for tax purposes — keep the
    // record but remove the job seeker's identity from it.
    if (role !== "employer") {
      const placements = await db.collection("placements").where("applicantId", "==", uid).get();
      for (const placement of placements.docs) {
        await placement.ref.update({ applicantId: "deleted", applicantName: DELETED_USER_LABEL });
      }
    }

    // Reports are kept for their retention period for safety reasons, but
    // the deleted person's name snapshot is removed.
    const reportsAbout = await db.collection("reports").where("reportedId", "==", uid).get();
    for (const report of reportsAbout.docs) {
      await report.ref.update({ reportedName: DELETED_USER_LABEL });
    }

    // Profile and all sub-collections (portfolio, notifications, push
    // subscriptions, readiness answers, interview booking).
    await db.recursiveDelete(userRef);

    // Uploaded files: ID document, CV, employer logo.
    const bucket = await getAdminStorageBucket();
    await bucket.deleteFiles({ prefix: `verification-ids/${uid}/` });
    await bucket.file(cvStoragePath(uid)).delete({ ignoreNotFound: true });
    await bucket.deleteFiles({ prefix: `employer-logos/${uid}/` });

    // Finally the sign-in account itself.
    const auth = await getAdminAuth();
    await auth.deleteUser(uid).catch((err: { code?: string }) => {
      if (err.code !== "auth/user-not-found") throw err;
    });

    return { ok: true };
  } catch (err) {
    console.error(`Account deletion failed part-way for ${uid}:`, err);
    return {
      ok: false,
      error: "Something went wrong deleting your account. Please try again.",
    };
  }
}

async function deleteQuery(query: Query): Promise<void> {
  const snap = await query.get();
  for (const doc of snap.docs) {
    await getAdminFirestore().recursiveDelete(doc.ref);
  }
}
