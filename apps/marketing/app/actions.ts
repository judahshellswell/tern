"use server";

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { sendGuardianNotification } from "@/lib/guardian-notification";
import { notifyAdminOfPendingVerification } from "@/lib/admin-notification";
import { sendRejectionNotification } from "@/lib/rejection-notification";
import { sendBanNotification } from "@/lib/ban-notification";
import { sendSuspensionNotification } from "@/lib/suspension-notification";
import { notifyAdminOfReport } from "@/lib/report-notification";
import { notifyEmployerOfApplication } from "@/lib/application-notification";
import { sendStatusChangeNotification } from "@/lib/status-notification";
import { getAdminFirestore, getAdminAuth, getAdminUid } from "@/lib/firebase-admin";
import { writeNotification } from "@/lib/notifications";
import { requireAdmin, requireUser } from "@/lib/server-auth";
import {
  writeReadinessGateSubmission,
  applyReadinessGateReview,
  type ReadinessRawAnswers,
} from "@/lib/readiness-gate";
import type {
  ApplicationStatus,
  Parish,
  ReadinessRetakeDelay,
  Report,
} from "@/lib/types";

// Every export of this "use server" module is a public HTTP endpoint —
// anyone can call it with any arguments, not just our own UI. So every
// action takes the caller's Firebase ID token first and derives "who is
// calling" from that (lib/server-auth.ts), never from a uid, email or
// name the browser passes in. Admin actions require the admin's token.
// Anything that shouldn't be callable from the browser at all belongs in
// lib/, not here.

const NOT_AUTHORIZED = { ok: false, error: "Not authorized." } as const;

// Called right after a job seeker profile is created, if they're under 18.
// Failure here shouldn't block account creation — the account already
// exists in Firestore by the time this runs — so callers should treat
// this as best-effort and not surface a hard error to the user. The
// guardian's address and the seeker's name come from the caller's own
// profile, and it only ever sends once per account, so this can't be
// used to send Tern-branded email to arbitrary addresses.
export async function notifyGuardian(idToken: string) {
  try {
    const { uid } = await requireUser(idToken);
    const ref = getAdminFirestore().collection("users").doc(uid);
    const profile = (await ref.get()).data();
    if (
      !profile ||
      profile.role !== "job_seeker" ||
      typeof profile.guardianEmail !== "string" ||
      !profile.guardianEmail ||
      profile.guardianNotifiedAt
    ) {
      return { ok: false } as const;
    }
    await ref.update({ guardianNotifiedAt: FieldValue.serverTimestamp() });
    await sendGuardianNotification({ guardianEmail: profile.guardianEmail, jobSeekerName: profile.displayName });
    return { ok: true } as const;
  } catch (err) {
    console.error("Failed to send guardian notification:", err);
    return { ok: false } as const;
  }
}

// Called right after any job seeker or employer profile is created (or
// resubmitted after rejection), so the admin doesn't have to poll /admin
// to know something is waiting. Same best-effort contract as
// notifyGuardian — never blocks account creation. Details come from the
// caller's own profile, and only while it's actually pending.
export async function notifyAdminOfSignup(idToken: string) {
  try {
    const { uid } = await requireUser(idToken);
    const profile = (await getAdminFirestore().collection("users").doc(uid).get()).data();
    if (!profile || profile.verificationStatus !== "pending") return { ok: false } as const;
    const role: "job_seeker" | "employer" = profile.role;
    const name: string = role === "job_seeker" ? profile.displayName : profile.businessName;
    const email: string = profile.email;
    await notifyAdminOfPendingVerification({ role, name, email });
    const adminUid = await getAdminUid();
    if (adminUid) {
      await writeNotification(
        adminUid,
        "admin_signup_pending",
        "New signup pending verification",
        `${name} (${role}) — ${email}`,
        "/admin",
      );
    }
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
export async function notifyRejection(idToken: string, uid: string, reason: string) {
  try {
    await requireAdmin(idToken);
    const profile = (await getAdminFirestore().collection("users").doc(uid).get()).data();
    if (!profile) return { ok: false } as const;
    const userEmail: string = profile.email;
    const name: string = profile.role === "job_seeker" ? profile.displayName : profile.businessName;
    await sendRejectionNotification({ userEmail, name, reason });
    await writeNotification(uid, "signup_rejected", "Application not approved", reason, "/dashboard");
    return { ok: true } as const;
  } catch (err) {
    console.error("Failed to send rejection notification:", err);
    return { ok: false } as const;
  }
}

// Called right after an application is written to Firestore, with its
// id. Everything comes from server-truth: the caller must be the
// application's applicant, the employer and job title come from the job
// doc itself (not the application, whose employerId the applicant
// wrote), and the employer's email/business name from their profile.
// Same best-effort contract as the other notify actions — the
// application already exists by the time this runs, so a failed send
// shouldn't be surfaced as if the application failed.
export async function notifyEmployerOfNewApplication(idToken: string, applicationId: string) {
  try {
    const { uid } = await requireUser(idToken);
    const db = getAdminFirestore();
    const application = (await db.collection("applications").doc(applicationId).get()).data();
    if (!application || application.applicantId !== uid || application.notifiedEmployerAt) {
      return { ok: false } as const;
    }
    const job = (await db.collection("jobs").doc(application.jobId).get()).data();
    if (!job || job.employerId !== application.employerId) return { ok: false } as const;
    await db.collection("applications").doc(applicationId).update({ notifiedEmployerAt: FieldValue.serverTimestamp() });
    const employerId: string = job.employerId;
    const jobId: string = application.jobId;
    const jobTitle: string = job.title;
    const applicantName: string = application.applicantName;
    const coverNote: string = application.coverNote;
    const snap = await db.collection("users").doc(employerId).get();
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
    await writeNotification(
      employerId,
      "new_application",
      "New application received",
      `${applicantName} applied to ${jobTitle}`,
      `/employer/jobs/${jobId}`,
    );
    return { ok: true } as const;
  } catch (err) {
    console.error("Failed to send application notification:", err);
    return { ok: false } as const;
  }
}

// Called right after an employer changes an application's status, with
// the application's id. The caller must be that application's employer;
// the status, job title and applicant's email/name all come from
// server-truth (the application and the applicant's profile), never from
// the employer's client. Same best-effort contract — the status change
// is already written to Firestore by the time this runs, so a failed
// send shouldn't be surfaced as if the update failed.
export async function notifyApplicantOfStatusChange(idToken: string, applicationId: string) {
  try {
    const { uid } = await requireUser(idToken);
    const application = (await getAdminFirestore().collection("applications").doc(applicationId).get()).data();
    if (!application || application.employerId !== uid) return { ok: false } as const;
    const status = application.status as ApplicationStatus;
    if (status === "submitted" || status === "withdrawn") return { ok: false } as const;
    const applicantId: string = application.applicantId;
    const jobTitle: string = application.jobTitle;
    const snap = await getAdminFirestore().collection("users").doc(applicantId).get();
    const applicant = snap.data();
    if (!applicant || applicant.role !== "job_seeker") {
      return { ok: false } as const;
    }
    await sendStatusChangeNotification(applicant.email, applicant.displayName, jobTitle, status);
    await writeNotification(
      applicantId,
      "application_status_changed",
      "Application update",
      `Your application for ${jobTitle} is now "${status}"`,
      "/dashboard",
    );
    return { ok: true } as const;
  } catch (err) {
    console.error("Failed to send status change notification:", err);
    return { ok: false } as const;
  }
}

// Called from the readiness-gate submission form. Unlike the other
// notify* actions in this file, the AI grading call itself is NOT a
// best-effort side effect — it's the actual state transition (pass vs.
// flag), so a grading failure is already handled inside
// writeReadinessGateSubmission (falls back to "flagged", never
// silently drops the submission). This action's own try/catch only
// guards the (best-effort) notification sends afterward.
export async function submitReadinessGate(
  idToken: string,
  rawAnswers: ReadinessRawAnswers,
): Promise<{ ok: true; outcome: "passed" | "flagged" } | { ok: false; error: string }> {
  const caller = await requireUser(idToken).catch(() => null);
  if (!caller) return NOT_AUTHORIZED;
  const uid = caller.uid;
  const db = getAdminFirestore();
  const result = await writeReadinessGateSubmission(db, uid, rawAnswers);
  if (!result.ok) return result;

  try {
    const userSnap = await db.collection("users").doc(uid).get();
    const displayName = userSnap.data()?.displayName ?? "";

    if (result.outcome === "passed") {
      await writeNotification(
        uid,
        "readiness_gate_passed",
        "You're ready to apply",
        "Nice work — your answers were approved. You can apply to jobs now.",
        "/jobs",
      );
    } else {
      await writeNotification(
        uid,
        "readiness_gate_flagged",
        "Your answers are being reviewed",
        "We're taking a closer look at your answers before you can start applying — we'll be in touch soon.",
        "/dashboard",
      );
      const adminUid = await getAdminUid();
      if (adminUid) {
        await writeNotification(
          adminUid,
          "admin_readiness_review_pending",
          "Readiness answers flagged for review",
          `${displayName || uid} — flagged by AI screening`,
          "/admin",
        );
      }
    }
  } catch (err) {
    console.error("Failed to send readiness gate notification:", err);
  }

  return result;
}

// Admin action for the flagged-review queue. Approve overrides the AI
// flag and passes the seeker; reject requires a reason (reusing
// ReasonForm's "readiness_reject" kind) plus a retake delay chosen by
// the admin — "none" matches the original no-cooldown behavior,
// anything else (or "permanent") is enforced server-side in
// writeReadinessGateSubmission, not just shown in the UI.
export async function reviewReadinessGate(
  idToken: string,
  uid: string,
  decision: "approve" | "reject",
  reason?: string,
  retakeDelay?: ReadinessRetakeDelay,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin(idToken).catch(() => null);
  if (!admin) return NOT_AUTHORIZED;
  const db = getAdminFirestore();
  const result = await applyReadinessGateReview(db, uid, decision, reason, admin.email ?? "", retakeDelay);
  if (!result.ok) return result;

  try {
    if (decision === "approve") {
      await writeNotification(
        uid,
        "readiness_gate_passed",
        "You're ready to apply",
        "An admin reviewed your answers and approved them — you can apply to jobs now.",
        "/jobs",
      );
    } else {
      await writeNotification(
        uid,
        "readiness_gate_rejected",
        "Your answers weren't approved",
        reason ?? "",
        "/dashboard",
      );
    }
  } catch (err) {
    console.error("Failed to send readiness gate review notification:", err);
  }

  return result;
}

export type ApplicantProfileForEmployer = {
  displayName: string;
  location: Parish;
  portfolio: { id: string; title: string; description: string }[];
};

// Lets an employer open a fuller profile for someone who applied to one
// of their jobs. The employer is the verified caller, and access
// requires a real `applications` document linking them to applicantId,
// which only exists if that applicant genuinely applied to that
// employer's job. This is the same trust boundary the rest of the app
// already exposes to that employer via the applications collection
// (they can already read applicantName off a real application) — this
// action just returns more fields (location, portfolio) once that same
// relationship is confirmed. Never returns idDocumentPath, dateOfBirth,
// guardianEmail, or email.
export async function getApplicantProfileForEmployer(
  idToken: string,
  applicantId: string,
): Promise<ApplicantProfileForEmployer | null> {
  const caller = await requireUser(idToken).catch(() => null);
  if (!caller) return null;
  const employerId = caller.uid;
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

// Shared by banUserAccount and suspendUserAccount — closes an
// employer's live jobs and marks their applications' jobStatus closed
// to match (unconditional, not filtered by prior jobStatus, matching
// the original ban behavior exactly). No-op for a job seeker; the
// job-seeker-side application flagging (applicantBanned vs
// applicantSuspended) differs between ban and suspend, so it stays in
// each caller rather than living here.
async function closeAccountActivity(
  db: Firestore,
  uid: string,
  role: "job_seeker" | "employer",
): Promise<void> {
  if (role !== "employer") return;

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
  idToken: string,
  uid: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireAdmin(idToken).catch(() => null))) return NOT_AUTHORIZED;
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

  await closeAccountActivity(db, uid, profile.role);

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
    await writeNotification(uid, "account_banned", "Account banned", reason, "/dashboard");
  } catch (err) {
    console.error("Failed to send ban notification:", err);
  }

  return { ok: true };
}

// Reversible counterpart to banUserAccount, triggered either directly by
// an admin or automatically once an account accrues 3+ open reports (see
// createReport below). Reuses the same employer-jobs-closing cascade as
// ban, but deliberately does NOT disable the Firebase Auth account (a
// suspended user must still be able to log in to see the "under review"
// screen) and flags a job seeker's applications with applicantSuspended
// rather than applicantBanned, since that flag must be independently
// clearable on unsuspendUserAccount without touching a real ban.
export async function suspendUserAccount(
  idToken: string,
  uid: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireAdmin(idToken).catch(() => null))) return NOT_AUTHORIZED;
  return suspendAccount(uid, reason);
}

// Not exported — also used by createReport's auto-suspend, which runs
// on a (verified) reporter's behalf rather than the admin's.
async function suspendAccount(
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
    verificationStatus: "suspended",
    rejectionReason: reason,
  });

  await closeAccountActivity(db, uid, profile.role);

  if (profile.role === "job_seeker") {
    const applicationsSnap = await db.collection("applications").where("applicantId", "==", uid).get();
    if (!applicationsSnap.empty) {
      const batch = db.batch();
      applicationsSnap.docs.forEach((appDoc) => batch.update(appDoc.ref, { applicantSuspended: true }));
      await batch.commit();
    }
  }

  try {
    await sendSuspensionNotification({ userEmail: profile.email, name, reason });
    await writeNotification(uid, "account_suspended", "Account suspended", reason, "/dashboard");
  } catch (err) {
    console.error("Failed to send suspension notification:", err);
  }

  return { ok: true };
}

// Admin-only reversal of suspendUserAccount. Restores verificationStatus
// to "approved" (not "pending" — a suspended account was, by definition,
// already approved before suspension) and clears the suspension reason.
// Deliberately does NOT reopen any jobs the employer cascade closed —
// the employer reopens each one manually via the existing "Reopen job"
// button — and sends no email (only the initial suspension is emailed).
export async function unsuspendUserAccount(
  idToken: string,
  uid: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireAdmin(idToken).catch(() => null))) return NOT_AUTHORIZED;
  return unsuspendAccount(uid);
}

// Not exported — also used by dismissReport's auto-lift.
async function unsuspendAccount(uid: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getAdminFirestore();

  const userSnap = await db.collection("users").doc(uid).get();
  const profile = userSnap.data();
  if (!profile) {
    return { ok: false, error: "User not found." };
  }
  if (profile.verificationStatus !== "suspended") {
    return { ok: false, error: "Account is not suspended." };
  }

  await db.collection("users").doc(uid).update({
    verificationStatus: "approved",
    rejectionReason: FieldValue.delete(),
  });

  if (profile.role === "job_seeker") {
    const applicationsSnap = await db
      .collection("applications")
      .where("applicantId", "==", uid)
      .where("applicantSuspended", "==", true)
      .get();
    if (!applicationsSnap.empty) {
      const batch = db.batch();
      applicationsSnap.docs.forEach((appDoc) => batch.update(appDoc.ref, { applicantSuspended: false }));
      await batch.commit();
    }
  }

  return { ok: true };
}

const OPEN_REPORT_SUSPEND_THRESHOLD = 3;

// Counts distinct reporters, not reports — otherwise one person filing
// three reports could get anyone auto-suspended on their own.
async function countOpenReportsAgainst(db: Firestore, reportedId: string): Promise<number> {
  const snap = await db
    .collection("reports")
    .where("reportedId", "==", reportedId)
    .where("status", "==", "open")
    .get();
  return new Set(snap.docs.map((d) => d.data().reporterId)).size;
}

// Pre-allocates a report document ID (no write) so the client can
// upload evidence images to a stable Storage path before the report
// document itself exists — same ordering as ID-document upload already
// runs ahead of profile creation elsewhere in this app.
export async function reserveReportId(idToken: string): Promise<string> {
  await requireUser(idToken);
  return getAdminFirestore().collection("reports").doc().id;
}

// Reporter identity/role and the reported user's role/name are all
// looked up server-side from the verified caller and reportedId.
export type CreateReportParams = {
  reportId: string; // from reserveReportId()
  reportedId: string;
  reason: string;
  evidenceImagePaths?: string[];
};

const MAX_REPORT_REASON_LENGTH = 2000;
const MAX_REPORT_EVIDENCE = 3;

// The report-creation entry point — runs server-side (unlike a bare
// client addDoc) because it needs the Admin SDK for two things a
// reporter's own client can't do: sending the admin-alert email (Resend
// is server-only) and counting open reports against the reported
// account to decide on auto-suspension (the reports collection's `list`
// rule is admin-only, so a client-side count is impossible for anyone
// but the admin). Writes the report itself using the pre-reserved id.
export async function createReport(
  idToken: string,
  params: CreateReportParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const caller = await requireUser(idToken).catch(() => null);
  if (!caller) return NOT_AUTHORIZED;
  const reporterId = caller.uid;
  const db = getAdminFirestore();

  if (reporterId === params.reportedId) {
    return { ok: false, error: "You can't report yourself." };
  }
  const reason = typeof params.reason === "string" ? params.reason.trim() : "";
  if (!reason || reason.length > MAX_REPORT_REASON_LENGTH) {
    return { ok: false, error: "Please give a reason (up to 2000 characters)." };
  }
  // Evidence must be files the reporter uploaded themself for this report.
  const evidenceImagePaths = params.evidenceImagePaths ?? [];
  if (
    evidenceImagePaths.length > MAX_REPORT_EVIDENCE ||
    !evidenceImagePaths.every((p) => typeof p === "string" && p.startsWith(`report-evidence/${reporterId}/`))
  ) {
    return { ok: false, error: "Invalid evidence." };
  }

  const reporterProfile = (await db.collection("users").doc(reporterId).get()).data();
  if (!reporterProfile) {
    return { ok: false, error: "Your account wasn't found." };
  }
  const reportedSnap = await db.collection("users").doc(params.reportedId).get();
  const reportedProfile = reportedSnap.data();
  if (!reportedProfile) {
    return { ok: false, error: "Reported user not found." };
  }
  const reportedName: string =
    reportedProfile.role === "job_seeker" ? reportedProfile.displayName : reportedProfile.businessName;

  const reportRef = db.collection("reports").doc(params.reportId);
  if ((await reportRef.get()).exists) {
    return { ok: false, error: "This report was already submitted." };
  }
  await reportRef.set({
    reporterId,
    reporterRole: reporterProfile.role,
    reportedId: params.reportedId,
    reportedRole: reportedProfile.role,
    reportedName,
    reason,
    status: "open",
    ...(evidenceImagePaths.length ? { evidenceImagePaths } : {}),
    createdAt: FieldValue.serverTimestamp(),
  });

  try {
    await notifyAdminOfReport({
      reportId: params.reportId,
      reporterRole: reporterProfile.role,
      reportedName,
      reportedRole: reportedProfile.role,
      reason,
    });
    const adminUid = await getAdminUid();
    if (adminUid) {
      await writeNotification(
        adminUid,
        "admin_report_filed",
        "New report filed",
        `${reportedName} reported: ${reason}`,
        `/admin/reports/${params.reportId}`,
      );
    }
  } catch (err) {
    console.error("Failed to send report notification:", err);
  }

  try {
    const openCount = await countOpenReportsAgainst(db, params.reportedId);
    if (
      openCount >= OPEN_REPORT_SUSPEND_THRESHOLD &&
      reportedProfile?.verificationStatus !== "banned" &&
      reportedProfile?.verificationStatus !== "suspended"
    ) {
      await suspendAccount(
        params.reportedId,
        `Automatically suspended after reports from ${openCount} different people.`,
      );
    }
  } catch (err) {
    console.error("Failed to check/apply auto-suspend after report creation:", err);
  }

  return { ok: true };
}

// Marks a report dismissed, then re-checks whether the reported
// account's open-report count has dropped back under the auto-suspend
// threshold — if it has and the account is currently suspended, lifts
// the suspension. Only reverses what dismissal itself could plausibly
// have caused: a ban, or a suspension an admin applied directly for
// unrelated reasons, is left untouched by this check on its own (an
// admin-applied suspension only gets auto-lifted here if the report
// count genuinely happens to be under threshold at the time — there's
// no separate "was this auto-triggered" flag to distinguish the two).
export async function dismissReport(
  idToken: string,
  reportId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin(idToken).catch(() => null);
  if (!admin) return NOT_AUTHORIZED;
  const resolvedBy = admin.email ?? "";
  const db = getAdminFirestore();

  const reportSnap = await db.collection("reports").doc(reportId).get();
  const report = reportSnap.data();
  if (!report) {
    return { ok: false, error: "Report not found." };
  }

  await db.collection("reports").doc(reportId).update({
    status: "dismissed",
    resolvedAt: FieldValue.serverTimestamp(),
    resolvedBy,
  });

  try {
    const openCount = await countOpenReportsAgainst(db, report.reportedId);
    if (openCount < OPEN_REPORT_SUSPEND_THRESHOLD) {
      const reportedSnap = await db.collection("users").doc(report.reportedId).get();
      if (reportedSnap.data()?.verificationStatus === "suspended") {
        await unsuspendAccount(report.reportedId);
      }
    }
  } catch (err) {
    console.error("Failed to re-check/lift auto-suspend after report dismissal:", err);
  }

  return { ok: true };
}

// Marks a report "actioned" after the admin bans the reported account —
// distinct from dismissReport, which means "this report wasn't valid."
// Deliberately does not re-check/lift a suspension the way dismissReport
// does: banning always wins over any suspension state, so there's
// nothing to reverse here.
export async function markReportActioned(
  idToken: string,
  reportId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin(idToken).catch(() => null);
  if (!admin) return NOT_AUTHORIZED;
  const resolvedBy = admin.email ?? "";
  const db = getAdminFirestore();

  const reportSnap = await db.collection("reports").doc(reportId).get();
  if (!reportSnap.exists) {
    return { ok: false, error: "Report not found." };
  }

  await db.collection("reports").doc(reportId).update({
    status: "actioned",
    resolvedAt: FieldValue.serverTimestamp(),
    resolvedBy,
  });

  return { ok: true };
}

export type ReportDetailForAdmin = {
  report: Report;
  reportedProfile:
    | {
        role: "job_seeker";
        displayName: string;
        email: string;
        dateOfBirth: string;
        guardianEmail: string | null;
        location: string;
        preferredJobTypes?: string[];
        verificationStatus: string;
        rejectionReason?: string;
        createdAt: string;
      }
    | {
        role: "employer";
        businessName: string;
        email: string;
        registrationNumber: string;
        location: string;
        verificationStatus: string;
        rejectionReason?: string;
        createdAt: string;
      };
  otherReports: Report[];
};

// Admin-only detail fetch for the reports detail page — requires the
// admin's verified token, like every other admin action here. The
// admin-facing profile snapshot can include more than the
// employer-facing ApplicantProfileForEmployer above (email, dateOfBirth)
// since this audience is trusted more broadly.
export async function getReportDetailForAdmin(
  idToken: string,
  reportId: string,
): Promise<ReportDetailForAdmin | null> {
  if (!(await requireAdmin(idToken).catch(() => null))) return null;
  const db = getAdminFirestore();

  const reportSnap = await db.collection("reports").doc(reportId).get();
  const reportData = reportSnap.data();
  if (!reportData) return null;
  const report = { id: reportSnap.id, ...reportData } as Report;

  const profileSnap = await db.collection("users").doc(report.reportedId).get();
  const profile = profileSnap.data();
  if (!profile) return null;

  const otherReportsSnap = await db.collection("reports").where("reportedId", "==", report.reportedId).get();
  const otherReports = otherReportsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Report)
    .filter((r) => r.id !== reportId);

  const reportedProfile: ReportDetailForAdmin["reportedProfile"] =
    profile.role === "job_seeker"
      ? {
          role: "job_seeker",
          displayName: profile.displayName,
          email: profile.email,
          dateOfBirth: profile.dateOfBirth,
          guardianEmail: profile.guardianEmail,
          location: profile.location,
          preferredJobTypes: profile.preferredJobTypes,
          verificationStatus: profile.verificationStatus,
          rejectionReason: profile.rejectionReason,
          createdAt: profile.createdAt,
        }
      : {
          role: "employer",
          businessName: profile.businessName,
          email: profile.email,
          registrationNumber: profile.registrationNumber,
          location: profile.location,
          verificationStatus: profile.verificationStatus,
          rejectionReason: profile.rejectionReason,
          createdAt: profile.createdAt,
        };

  return { report, reportedProfile, otherReports };
}
