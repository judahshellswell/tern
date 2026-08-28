"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { getApplicantProfileForEmployer, type ApplicantProfileForEmployer } from "@/app/actions";

export default function ApplicantProfilePage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <ApplicantProfile applicantId={uid} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function ApplicantProfile({ applicantId }: { applicantId: string }) {
  const { user, profile, loading } = useAuth();
  const [result, setResult] = useState<ApplicantProfileForEmployer | null | undefined>(undefined);

  useEffect(() => {
    if (!user || !profile || profile.role !== "employer") return;
    let cancelled = false;
    getApplicantProfileForEmployer(user.uid, applicantId).then((data) => {
      if (!cancelled) setResult(data);
    });
    return () => {
      cancelled = true;
    };
  }, [user, profile, applicantId]);

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
        <p className="text-granite">Only employer accounts can view applicant profiles.</p>
      </div>
    );
  }

  if (result === undefined) {
    return <p className="text-granite">Loading…</p>;
  }

  if (result === null) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">That profile couldn&rsquo;t be found.</p>
      </div>
    );
  }

  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">Applicant</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
        {result.displayName}
      </h1>
      <p className="mt-1 text-granite">{result.location}</p>

      <div className="mt-8">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.1em] text-granite-soft">
          Portfolio
        </p>
        {result.portfolio.length === 0 ? (
          <div className="rounded-2xl border border-border-strong bg-paper-raised p-8 text-center">
            <p className="text-sm text-granite">No portfolio entries yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {result.portfolio.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-border-strong bg-paper-raised p-5"
              >
                <p className="font-serif text-lg font-semibold">{entry.title}</p>
                {entry.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{entry.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
