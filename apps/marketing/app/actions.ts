"use server";

import { FieldValue } from "firebase-admin/firestore";
import { addToWaitlist, type WaitlistRole } from "@/lib/waitlist";
import { sendGuardianNotification } from "@/lib/guardian-notification";
import { notifyAdminOfPendingVerification } from "@/lib/admin-notification";
import { sendRejectionNotification } from "@/lib/rejection-notification";
import { sendBanNotification } from "@/lib/ban-notification";
import { notifyEmployerOfApplication } from "@/lib/application-notification";
import { sendStatusChangeNotification } from "@/lib/status-notification";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";
import type { ApplicationStatus, Parish } from "@/lib/types";

export type WaitlistFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function joinWaitlist(
  _prevState: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  const email = String(formData.get("email") ?? "");
  const role = formData.get("role") === "employer" ? "employer" : "job_seeker";

  const result = await addToWaitlist(email, role as WaitlistRole);

  if (!result.ok) {
    if (result.reason === "already_registered") {
      return {
        status: "success",
        message: "You're already on the list — we'll be in touch.",
      };
    }
    return {
      status: "error",
      message: "That doesn't look like a valid email address.",
    };
  }

  return {
    status: "success",
    message:
      role === "employer"
        ? "You're on the list. We'll email you as soon as employer verification opens in Jersey."
        : "You're on the list. We'll email you the moment Tern opens in Jersey.",
  };
}

// Called right after a job seeker profile is created, if they're under 18.
// Failure here shouldn't block account creation — the account already
// exists in Firestore by the time this runs — so callers should treat
// this as best-effort and not surface a hard error to the user.
export async function notifyGuardian(guardianEmail: string, jobSeekerName: string) {
  try {
    await sendGuardianNotification({ guardianEmail, jobSeekerName });
    return { ok: true } as const;
  } catch (err) {
    console.error("Failed to send guardian notification:", err);
    return { ok: false } as const;
  }
}

// Called right after any job seeker or employer profile is created, so the
// admin doesn't have to poll /admin to know something is waiting. Same
// best-effort contract as notifyGuardian — never blocks account creation.
export async function notifyAdminOfSignup(
  role: "job_seeker" | "employer",
  name: string,
  email: string,
) {
  try {
    await notifyAdminOfPendingVerification({ role, name, email });
    return { ok: true } as const;
  } catch (err) {
    console.error("Failed to send admin verification notification:", err);
    return { ok: false } as const;
  }
}

// Called right after the admin rejects a job seeker or employer with a
// reason. Same best-effort contract — the rejection itself is already
// written to Firestore by the time this runs, so a failed send shouldn't
// be surfaced as if the rejection failed.
export async function notifyRejection(userEmail: string, name: string, reason: string) {
  try {
    await sendRejectionNotification({ userEmail, name, reason });
    return { ok: true } as const;
  } catch (err) {
    console.error("Failed to send rejection notification:", err);
    return { ok: false } as const;
  }
}

// Called right after an application is written to Firestore. The
// employer's email/business name comes from server-truth (their own
// profile doc via the Admin SDK) rather than anything the client passes
// in. Same best-effort contract as the other notify actions — the
// application already exists by the time this runs, so a failed send
// shouldn't be surfaced as if the application failed.
export async function notifyEmployerOfNewApplication(
  employerId: string,
  jobId: string,
  jobTitle: string,
  applicantName: string,
  coverNote: string,
) {
  try {
    const snap = await getAdminFirestore().collection("users").doc(employerId).get();
    const employer = snap.data();
    if (!employer || employer.role !== "employer") {
      return { ok: false } as const;
    }
    await notifyEmployerOfApplication({
      employerEmail: employer.email,
      employerName: employer.businessName,
      applicantName,
      jobId,
      jobTitle,
      coverNote,
    });
    return { ok: true } as const;
  } catch (err) {
    console.error("Failed to send application notification:", err);
    return { ok: false } as const;
  }
}

// Called right after an employer changes an application's status. The
// applicant's email/name comes from server-truth (their own profile doc
// via the Admin SDK), never from the employer's client — same trust
// boundary as notifyEmployerOfNewApplication. Same best-effort contract —
// the status change is already written to Firestore by the time this
// runs, so a failed send shouldn't be surfaced as if the update failed.
export async function notifyApplicantOfStatusChange(
  applicantId: string,
  jobTitle: string,
  status: Exclude<ApplicationStatus, "submitted" | "withdrawn">,
) {
  try {
    const snap = await getAdminFirestore().collection("users").doc(applicantId).get();
    const applicant = snap.data();
    if (!applicant || applicant.role !== "job_seeker") {
      return { ok: false } as const;
    }
    await sendStatusChangeNotification(applicant.email, applicant.displayName, jobTitle, status);
    return { ok: true } as const;
  } catch (err) {
    console.error("Failed to send status change notification:", err);
    return { ok: false } as const;
  }
}

export type ApplicantProfileForEmployer = {
  displayName: string;
  location: Parish;
  portfolio: { id: string; title: string; description: string }[];
};

// Lets an employer open a fuller profile for someone who applied to one
// of their jobs. There's no server-side session in this app (auth is
// Firebase client-SDK only), so the caller's identity can't be verified
// here the way a normal server session would — instead, access is gated
// by requiring a real `applications` document linking employerId to
// applicantId, which only exists if that applicant genuinely applied to
// that employer's job. This is the same trust boundary the rest of the
// app already exposes to that employer via the applications collection
// (they can already read applicantName off a real application) — this
// action just returns more fields (location, portfolio) once that same
// relationship is confirmed. Never returns idDocumentPath, dateOfBirth,
// guardianEmail, or email.
export async function getApplicantProfileForEmployer(
  employerId: string,
  applicantId: string,
): Promise<ApplicantProfileForEmployer | null> {
  const db = getAdminFirestore();

  const applicationsSnap = await db
    .collection("applications")
    .where("employerId", "==", employerId)
    .where("applicantId", "==", applicantId)
    .limit(1)
    .get();
  if (applicationsSnap.empty) {
    return null;
  }

  const profileSnap = await db.collection("users").doc(applicantId).get();
  const profile = profileSnap.data();
  if (!profile || profile.role !== "job_seeker") {
    return null;
  }

  const portfolioSnap = await db
    .collection("users")
    .doc(applicantId)
    .collection("portfolioEntries")
    .orderBy("createdAt", "desc")
    .get();

  return {
    displayName: profile.displayName,
    location: profile.location,
    portfolio: portfolioSnap.docs.map((d) => ({
      id: d.id,
      title: d.data().title,
      description: d.data().description,
    })),
  };
}

// The single ban entry point — used by the pending-verification queue's
// existing ban button and by the "all approved users" and "reports"
// admin queues. Looks up role/name/email itself from server truth
// (never trusts a caller-supplied name/email) and cascades the ban
// across every collection that denormalizes something about this user:
// closes an employer's live jobs (and marks their applications'
// jobStatus closed to match), flags a job seeker's existing applications
// applicantBanned so employers stop seeing them, and disables the
// Firebase Auth account so they can't log back in. Firestore is updated
// first — that alone is enough to lock the account out at the app level
// via existing rules and the dashboard's suspended-account screen — so a
// failure disabling Auth afterward is logged but doesn't undo the ban.
export async function banUserAccount(
  uid: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getAdminFirestore();

  const userSnap = await db.collection("users").doc(uid).get();
  const profile = userSnap.data();
  if (!profile) {
    return { ok: false, error: "User not found." };
  }
  const name = profile.role === "job_seeker" ? profile.displayName : profile.businessName;

  await db.collection("users").doc(uid).update({
    verificationStatus: "banned",
    rejectionReason: reason,
  });

  if (profile.role === "employer") {
    const jobsSnap = await db
      .collection("jobs")
      .where("employerId", "==", uid)
      .where("status", "==", "published")
      .get();
    if (!jobsSnap.empty) {
      const batch = db.batch();
      jobsSnap.docs.forEach((jobDoc) => batch.update(jobDoc.ref, { status: "closed" }));
      await batch.commit();
    }

    const applicationsSnap = await db.collection("applications").where("employerId", "==", uid).get();
    if (!applicationsSnap.empty) {
      const batch = db.batch();
      applicationsSnap.docs.forEach((appDoc) => batch.update(appDoc.ref, { jobStatus: "closed" }));
      await batch.commit();
    }
  }

  if (profile.role === "job_seeker") {
    const applicationsSnap = await db.collection("applications").where("applicantId", "==", uid).get();
    if (!applicationsSnap.empty) {
      const batch = db.batch();
      applicationsSnap.docs.forEach((appDoc) => batch.update(appDoc.ref, { applicantBanned: true }));
      await batch.commit();
    }
  }

  try {
    const auth = await getAdminAuth();
    await auth.updateUser(uid, { disabled: true });
  } catch (err) {
    console.error(`Failed to disable Auth account for ${uid}:`, err);
  }

  try {
    await sendBanNotification({ userEmail: profile.email, name, reason });
  } catch (err) {
    console.error("Failed to send ban notification:", err);
  }

  return { ok: true };
}

// Best-effort — a failed increment should never break the job detail
// page render. Called once per real page load (see app/jobs/[id]/page.tsx),
// never from inside the metadata-generating fetch, to avoid double-counting.
export async function incrementJobViewCount(jobId: string): Promise<void> {
  try {
    await getAdminFirestore()
      .collection("jobs")
      .doc(jobId)
      .update({ viewCount: FieldValue.increment(1) });
  } catch (err) {
    console.error(`Failed to increment view count for job ${jobId}:`, err);
  }
}
