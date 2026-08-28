"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { JOB_TYPE_LABELS, type Job } from "@/lib/types";
import { formatPay } from "@/lib/format";

export default function EmployerJobsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">For employers</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">Your jobs.</h1>
          <div className="mt-8">
            <JobsList />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function JobsList() {
  const { user, profile, loading } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(getClientFirestore(), "jobs"),
      where("employerId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Job));
    });
    return unsubscribe;
  }, [user]);

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
        <p className="text-granite">Only employer accounts have jobs to manage.</p>
      </div>
    );
  }

  if (jobs === null) {
    return <p className="text-granite">Loading jobs…</p>;
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-8 text-center">
        <p className="font-serif text-lg font-semibold">You haven&rsquo;t posted any jobs yet</p>
        <p className="mt-1 text-sm text-granite">
          <Link href="/employer/jobs/new" className="font-medium text-tide underline hover:text-tide-bright">
            Post your first job
          </Link>{" "}
          to start receiving applications.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {jobs.map((job) => (
        <Link
          key={job.id}
          href={`/employer/jobs/${job.id}`}
          className="block rounded-2xl border border-border-strong bg-paper-raised p-6 transition-colors hover:border-tide"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-serif text-lg font-semibold">{job.title}</p>
              <p className="mt-0.5 text-sm text-granite">
                {job.location} &middot; {formatPay(job)}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span
                className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wide ${
                  job.status === "published" ? "bg-tide/10 text-tide" : "bg-gorse-bg text-gorse"
                }`}
              >
                {job.status === "published" ? "Published" : "Closed"}
              </span>
              <span className="rounded-full bg-tide/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-tide">
                {JOB_TYPE_LABELS[job.type]}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
