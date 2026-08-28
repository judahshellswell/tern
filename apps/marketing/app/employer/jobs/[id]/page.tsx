"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { JOB_TYPE_LABELS, type Application, type ApplicationStatus, type Job } from "@/lib/types";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "New",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as ApplicationStatus[];

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

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    await updateDoc(doc(getClientFirestore(), "applications", applicationId), { status });
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

  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">
        {JOB_TYPE_LABELS[job.type]}
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">{job.title}</h1>
      <p className="mt-1 text-granite">{job.location}</p>

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
                  <select
                    value={application.status}
                    onChange={(e) =>
                      updateStatus(application.id, e.target.value as ApplicationStatus)
                    }
                    className="rounded-full border border-border-strong bg-paper px-3 py-1.5 text-sm font-medium text-ink outline-none transition-colors focus:border-tide"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
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
