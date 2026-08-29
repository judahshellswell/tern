"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { EmployerLogo } from "@/components/jobs/jobs-browser";
import { APPLICATION_STATUS_LABELS, JOB_TYPE_LABELS, type Application } from "@/lib/types";
import { formatHours, formatPay } from "@/lib/format";

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard"
            className="text-xs font-mono uppercase tracking-[0.1em] text-granite-soft hover:text-tide"
          >
            &larr; Dashboard
          </Link>
          <div className="mt-4">
            <ApplicationDetail applicationId={id} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function ApplicationDetail({ applicationId }: { applicationId: string }) {
  const { user, profile, loading } = useAuth();
  const [application, setApplication] = useState<Application | null | undefined>(undefined);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  async function withdraw() {
    await updateDoc(doc(getClientFirestore(), "applications", applicationId), {
      status: "withdrawn",
    });
    setConfirmingWithdraw(false);
  }

  useEffect(() => {
    if (!user) return;
    const ref = doc(getClientFirestore(), "applications", applicationId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setApplication(snap.exists() ? ({ id: snap.id, ...snap.data() } as Application) : null);
      },
      // A permission-denied error (someone else's application) should
      // read the same as "not found" rather than hang on Loading… forever.
      () => setApplication(null),
    );
    return unsubscribe;
  }, [user, applicationId]);

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

  if (application === undefined) {
    return <p className="text-granite">Loading…</p>;
  }

  if (application === null || application.applicantId !== user.uid) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">That application couldn&rsquo;t be found.</p>
      </div>
    );
  }

  return (
    <>
      {application.jobType && (
        <span className="rounded-full bg-tide/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-tide">
          {JOB_TYPE_LABELS[application.jobType]}
        </span>
      )}
      <h1 className="mt-4 text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {application.jobTitle}
      </h1>
      <div className="mt-3 flex items-center gap-3">
        <EmployerLogo
          url={application.employerLogoUrl}
          name={application.employerName || application.jobTitle}
          size={48}
        />
        {application.employerName && <p className="text-lg text-granite">{application.employerName}</p>}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-y border-border py-4 font-mono text-sm text-ink">
        <span>{application.location}</span>
        {formatHours(application) && <span>{formatHours(application)}</span>}
        <span className="tabular-nums">{formatPay(application)}</span>
      </div>

      <p className="mt-8 max-w-[70ch] whitespace-pre-wrap text-[17px] leading-relaxed text-ink">
        {application.description}
      </p>

      {application.skills && application.skills.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-1.5">
          {application.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border-strong px-3 py-1.5 text-sm font-medium text-granite"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="mb-1.5 text-xs font-medium text-granite">Your application</p>
        {application.status === "withdrawn" ? (
          <p className="font-semibold text-granite">Withdrawn</p>
        ) : application.jobStatus === "closed" ? (
          <p className="font-semibold text-gorse">
            This job is no longer accepting applications and is currently being reviewed.
          </p>
        ) : (
          <p className="font-semibold text-tide">{APPLICATION_STATUS_LABELS[application.status]}</p>
        )}
        {application.coverNote && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{application.coverNote}</p>
        )}

        {application.status !== "withdrawn" && application.status !== "hired" && (
          <div className="mt-4">
            {!confirmingWithdraw ? (
              <button
                type="button"
                onClick={() => setConfirmingWithdraw(true)}
                className="text-sm font-medium text-gorse underline hover:opacity-80 cursor-pointer"
              >
                Withdraw application
              </button>
            ) : (
              <div className="rounded-xl border border-border-strong bg-paper p-4">
                <p className="text-sm text-ink">
                  Are you sure? The employer will be able to see you withdrew.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={withdraw}
                    className="rounded-full bg-gorse px-4 py-2 text-sm font-semibold text-paper transition-colors hover:opacity-90 cursor-pointer"
                  >
                    Withdraw application
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingWithdraw(false)}
                    className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-tide cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
