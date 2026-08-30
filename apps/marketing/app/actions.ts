"use server";

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { addToWaitlist, type WaitlistRole } from "@/lib/waitlist";
import { sendGuardianNotification } from "@/lib/guardian-notification";
import { notifyAdminOfPendingVerification } from "@/lib/admin-notification";
import { sendRejectionNotification } from "@/lib/rejection-notification";
import { sendBanNotification } from "@/lib/ban-notification";
import { sendSuspensionNotification } from "@/lib/suspension-notification";
import { notifyAdminOfReport } from "@/lib/report-notification";
import { notifyEmployerOfApplication } from "@/lib/application-notification";
import { sendStatusChangeNotification } from "@/lib/status-notification";
import { getAdminFirestore, getAdminAuth, getAdminUid } from "@/lib/firebase-admin";
import type { ApplicationStatus, NotificationKind, Parish, Report, UserRole } from "@/lib/types";

// Best-effort in-app notification write, mirroring an email already
// sent to the same uid. Never throws on its own — every call site
// wraps this the same way it already wraps the corresponding email
// send, so a Firestore write failure here can never block or fail the
// underlying action. Exported (not private) because the closing-soon
// cron route handler isn't a "use server" module and needs to import
// this directly.
export async function writeNotification(
  uid: string,
  kind: NotificationKind,
  title: string,
  body: string,
  link: string,
): Promise<void> {
  await getAdminFirestore()
    .collection("users")
    .doc(uid)
    .collection("notifications")
    .add({
      kind,
      title,
      body,
      link,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
}

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
export async function notifyRejection(uid: string, userEmail: string, name: string, reason: string) {
  try {
    await sendRejectionNotification({ userEmail, name, reason });
    await writeNotification(uid, "signup_rejected", "Application not approved", reason, "/dashboard");
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
export async function unsuspendUserAccount(uid: string): Promise<{ ok: true } | { ok: false; error: string }> {
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

const OPEN_REPORT_SUSPEND_THRESHOLD = 3;

async function countOpenReportsAgainst(db: Firestore, reportedId: string): Promise<number> {
  const snap = await db
    .collection("reports")
    .where("reportedId", "==", reportedId)
    .where("status", "==", "open")
    .get();
  return snap.size;
}

// Pre-allocates a report document ID (no write) so the client can
// upload evidence images to a stable Storage path before the report
// document itself exists — same ordering as ID-document upload already
// runs ahead of profile creation elsewhere in this app.
export async function reserveReportId(): Promise<string> {
  return getAdminFirestore().collection("reports").doc().id;
}

export type CreateReportParams = {
  reportId: string; // from reserveReportId()
  reporterId: string;
  reporterRole: UserRole;
  reportedId: string;
  reportedRole: UserRole;
  reportedName: string;
  reason: string;
  evidenceImagePaths?: string[];
};

// The report-creation entry point — runs server-side (unlike a bare
// client addDoc) because it needs the Admin SDK for two things a
// reporter's own client can't do: sending the admin-alert email (Resend
// is server-only) and counting open reports against the reported
// account to decide on auto-suspension (the reports collection's `list`
// rule is admin-only, so a client-side count is impossible for anyone
// but the admin). Writes the report itself using the pre-reserved id.
export async function createReport(
  params: CreateReportParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getAdminFirestore();

  if (params.reporterId === params.reportedId) {
    return { ok: false, error: "You can't report yourself." };
  }
  const reportedSnap = await db.collection("users").doc(params.reportedId).get();
  if (!reportedSnap.exists) {
    return { ok: false, error: "Reported user not found." };
  }

  await db
    .collection("reports")
    .doc(params.reportId)
    .set({
      reporterId: params.reporterId,
      reporterRole: params.reporterRole,
      reportedId: params.reportedId,
      reportedRole: params.reportedRole,
      reportedName: params.reportedName,
      reason: params.reason,
      status: "open",
      ...(params.evidenceImagePaths?.length ? { evidenceImagePaths: params.evidenceImagePaths } : {}),
      createdAt: FieldValue.serverTimestamp(),
    });

  try {
    await notifyAdminOfReport({
      reportId: params.reportId,
      reporterRole: params.reporterRole,
      reportedName: params.reportedName,
      reportedRole: params.reportedRole,
      reason: params.reason,
    });
    const adminUid = await getAdminUid();
    if (adminUid) {
      await writeNotification(
        adminUid,
        "admin_report_filed",
        "New report filed",
        `${params.reportedName} reported: ${params.reason}`,
        `/admin/reports/${params.reportId}`,
      );
    }
  } catch (err) {
    console.error("Failed to send report notification:", err);
  }

  try {
    const openCount = await countOpenReportsAgainst(db, params.reportedId);
    const reportedProfile = reportedSnap.data();
    if (
      openCount >= OPEN_REPORT_SUSPEND_THRESHOLD &&
      reportedProfile?.verificationStatus !== "banned" &&
      reportedProfile?.verificationStatus !== "suspended"
    ) {
      await suspendUserAccount(
        params.reportedId,
        `Automatically suspended after ${openCount} open reports.`,
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
  reportId: string,
  resolvedBy: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
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
        await unsuspendUserAccount(report.reportedId);
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
  reportId: string,
  resolvedBy: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
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

// Admin-only detail fetch for the reports detail page — gated the same
// way every other admin action in this file is (client-side AdminGate
// only; this codebase has no server-side session to check against). The
// admin-facing profile snapshot can include more than the
// employer-facing ApplicantProfileForEmployer above (email, dateOfBirth)
// since this audience is trusted more broadly.
export async function getReportDetailForAdmin(reportId: string): Promise<ReportDetailForAdmin | null> {
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
