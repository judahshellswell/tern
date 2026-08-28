"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { PostJobForm } from "@/components/employer/post-job-form";
import type { Job } from "@/lib/types";

export default function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-xl">
          <Link
            href={`/employer/jobs/${id}`}
            className="text-xs font-mono uppercase tracking-[0.1em] text-granite-soft hover:text-tide"
          >
            &larr; Back
          </Link>
          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight">Edit job.</h1>
          <div className="mt-8">
            <EditJobForm jobId={id} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function EditJobForm({ jobId }: { jobId: string }) {
  const { user, profile, loading } = useAuth();
  const [job, setJob] = useState<Job | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    const ref = doc(getClientFirestore(), "jobs", jobId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      setJob(snap.exists() ? ({ id: snap.id, ...snap.data() } as Job) : null);
    });
    return unsubscribe;
  }, [user, jobId]);

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
        <p className="text-granite">Only employer accounts can edit jobs.</p>
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

  return <PostJobForm initialJob={job} />;
}
