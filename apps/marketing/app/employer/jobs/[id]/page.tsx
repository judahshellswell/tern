"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import {
  APPLICATION_STATUS_LABELS,
  JOB_TYPE_LABELS,
  type Application,
  type ApplicationStatus,
  type Job,
} from "@/lib/types";
import { formatCloseDate, formatHours, formatPay } from "@/lib/format";
import { notifyApplicantOfStatusChange } from "@/app/actions";

// "withdrawn" is a one-way action the applicant takes on themself — it
// never appears as something the employer can select.
const STATUS_OPTIONS = (Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).filter(
  (status) => status !== "withdrawn",
);

export default function EmployerJobApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/employer/jobs"
            className="text-xs font-mono uppercase tracking-[0.1em] text-granite-soft hover:text-tide"
          >
            &larr; Your jobs
          </Link>
          <div className="mt-4">
            <JobApplicants jobId={id} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function JobApplicants({ jobId }: { jobId: string }) {
  const { user, profile, loading } = useAuth();
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [confirmingClose, setConfirmingClose] = useState(false);

  useEffect(() => {
    if (!user) return;
    const ref = doc(getClientFirestore(), "jobs", jobId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      setJob(snap.exists() ? ({ id: snap.id, ...snap.data() } as Job) : null);
    });
    return unsubscribe;
  }, [user, jobId]);

  useEffect(() => {
    if (!user || !job || job.employerId !== user.uid) return;
    const q = query(
      collection(getClientFirestore(), "applications"),
      where("employerId", "==", user.uid),
      where("jobId", "==", jobId),
      // Firestore rules can only prove a list query safe using fields the
      // query itself filters on — the read rule checks applicantBanned,
      // so this query must filter on it explicitly or every list here
      // gets rejected with permission-denied regardless of the result set.
      where("applicantBanned", "==", false),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Application));
    });
    return unsubscribe;
  }, [user, job, jobId]);

  async function updateStatus(application: Application, status: ApplicationStatus) {
    await updateDoc(doc(getClientFirestore(), "applications", application.id), { status });
    // "withdrawn" is never a value the employer's own dropdown can
    // produce (STATUS_OPTIONS excludes it) — this check is for TypeScript,
    // not a real runtime path.
    if (status !== "submitted" && status !== "withdrawn") {
      void notifyApplicantOfStatusChange(application.applicantId, application.jobTitle, status);
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      submitted: 0,
      reviewed: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
      withdrawn: 0,
    };
    (applications ?? []).forEach((application) => {
      counts[application.status]++;
    });
    return counts;
  }, [applications]);

  async function toggleJobStatus() {
    if (!job) return;
    const newStatus = job.status === "published" ? "closed" : "published";
    const db = getClientFirestore();
    const batch = writeBatch(db);
    batch.update(doc(db, "jobs", job.id), { status: newStatus });
    (applications ?? []).forEach((application) => {
      batch.update(doc(db, "applications", application.id), { jobStatus: newStatus });
    });
    await batch.commit();
    setConfirmingClose(false);
  }

  if (loading) {
    return <p className="text-granite">Loading…</p>;
  }

  if (!user || !profile) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">You need to be logged in to see this page.</p>
        <Link href="/log-in" className="mt-3 inline-block font-medium text-tide underline">
          Log in
        </Link>
      </div>
    );
  }

  if (profile.role !== "employer") {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">Only employer accounts can view applicants.</p>
      </div>
    );
  }

  if (job === undefined) {
    return <p className="text-granite">Loading…</p>;
  }

  if (job === null || job.employerId !== user.uid) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">That job couldn&rsquo;t be found.</p>
      </div>
    );
  }

  const closeDateLabel = formatCloseDate(job.closeDate);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">
          {JOB_TYPE_LABELS[job.type]}
        </p>
        <span
          className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wide ${
            job.status === "published" ? "bg-tide/10 text-tide" : "bg-gorse-bg text-gorse"
          }`}
        >
          {job.status === "published" ? "Published" : "Closed"}
        </span>
      </div>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">{job.title}</h1>
      <p className="mt-1 text-granite">{job.location}</p>
      <p className="mt-1 font-mono text-sm text-granite-soft">
        {formatPay(job)}
        {formatHours(job) ? ` · ${formatHours(job)}` : ""}
        {closeDateLabel ? ` · ${closeDateLabel}` : ""}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href={`/employer/jobs/${job.id}/edit`}
          className="text-sm font-medium text-tide underline hover:text-tide-bright"
        >
          Edit job
        </Link>
        {!confirmingClose && (
          <button
            type="button"
            onClick={() =>
              job.status === "published" ? setConfirmingClose(true) : toggleJobStatus()
            }
            className="text-sm font-medium text-tide underline hover:text-tide-bright cursor-pointer"
          >
            {job.status === "published" ? "Close job" : "Reopen job"}
          </button>
        )}
      </div>

      {confirmingClose && (
        <div className="mt-4 rounded-xl border border-border-strong bg-paper-raised p-4">
          <p className="text-sm text-ink">
            Are you sure? Applicants will still be able to see this in your dashboard, but
            it&rsquo;ll disappear from public search.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={toggleJobStatus}
              className="rounded-full bg-gorse px-4 py-2 text-sm font-semibold text-paper transition-colors hover:opacity-90 cursor-pointer"
            >
              Close job
            </button>
            <button
              type="button"
              onClick={() => setConfirmingClose(false)}
              className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-tide cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Views" value={job.viewCount ?? 0} />
        <StatTile label="New" value={statusCounts.submitted} />
        <StatTile label="Reviewed" value={statusCounts.reviewed} />
        <StatTile label="Shortlisted" value={statusCounts.shortlisted} />
        <StatTile label="Hired" value={statusCounts.hired} />
        <StatTile label="Rejected" value={statusCounts.rejected} />
        <StatTile label="Withdrawn" value={statusCounts.withdrawn} />
      </div>

      <div className="mt-8">
        {applications === null && <p className="text-granite">Loading applicants…</p>}

        {applications !== null && applications.length === 0 && (
          <div className="rounded-2xl border border-border-strong bg-paper-raised p-8 text-center">
            <p className="font-serif text-lg font-semibold">No applications yet</p>
            <p className="mt-1 text-sm text-granite">Check back once candidates start applying.</p>
          </div>
        )}

        {applications !== null && applications.length > 0 && (
          <div className="flex flex-col gap-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="rounded-2xl border border-border-strong bg-paper-raised p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link
                    href={`/employer/applicants/${application.applicantId}`}
                    className="font-serif text-lg font-semibold text-ink underline decoration-border-strong underline-offset-4 transition-colors hover:text-tide hover:decoration-tide"
                  >
                    {application.applicantName}
                  </Link>
                  {application.status === "withdrawn" ? (
                    <span className="rounded-full bg-gorse-bg px-3 py-1.5 text-sm font-medium text-gorse">
                      Withdrawn
                    </span>
                  ) : (
                    <select
                      value={application.status}
                      onChange={(e) =>
                        updateStatus(application, e.target.value as ApplicationStatus)
                      }
                      className="rounded-full border border-border-strong bg-paper px-3 py-1.5 text-sm font-medium text-ink outline-none transition-colors focus:border-tide"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {APPLICATION_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {application.coverNote && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-ink">
                    {application.coverNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border-strong bg-paper-raised px-4 py-3 text-center">
      <p className="font-serif text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-granite-soft">{label}</p>
    </div>
  );
}
