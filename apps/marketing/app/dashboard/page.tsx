"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { logOut } from "@/lib/auth-actions";
import { useRouter } from "next/navigation";
import { ReapplyForm } from "@/components/dashboard/reapply-form";
import type { UserProfile } from "@/lib/types";
import { useState } from "react";

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 px-6 py-20 text-center text-granite">Loading…</main>
        <SiteFooter />
      </>
    );
  }

  if (!user || !profile) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 px-6 py-20 text-center">
          <p className="text-granite">You need to be logged in to see this page.</p>
          <Link href="/log-in" className="mt-4 inline-block font-medium text-tide underline">
            Log in
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (profile.verificationStatus === "banned") {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 px-6 py-20">
          <div className="mx-auto max-w-md text-center">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-gorse">
              Account suspended
            </p>
            <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight">
              This account has been suspended.
            </h1>
            {profile.rejectionReason && (
              <p className="mt-4 rounded-2xl border border-border-strong bg-gorse-bg px-5 py-4 text-sm text-ink">
                &ldquo;{profile.rejectionReason}&rdquo;
              </p>
            )}
            <p className="mt-4 text-sm text-granite">
              If you believe this is a mistake, contact us and we&rsquo;ll look into it.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Link
                href="/contact"
                className="rounded-full bg-tide px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright"
              >
                Contact us
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logOut();
                  router.push("/");
                }}
                className="text-sm text-granite underline hover:text-tide cursor-pointer"
              >
                Log out
              </button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">
            {profile.role === "job_seeker" ? "Job seeker" : "Employer"} dashboard
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
            {profile.role === "job_seeker" ? profile.displayName : profile.businessName}
          </h1>

          <VerificationBanner profile={profile} />

          <div className="mt-8 flex flex-col gap-3">
            {profile.role === "job_seeker" ? (
              <Link
                href="/jobs"
                className="rounded-2xl border border-border-strong bg-paper-raised p-5 transition-colors hover:border-tide"
              >
                <p className="font-serif text-lg font-semibold">Browse jobs</p>
                <p className="mt-1 text-sm text-granite">
                  See what&rsquo;s open right now in Jersey.
                </p>
              </Link>
            ) : profile.verificationStatus === "approved" ? (
              <Link
                href="/employer/jobs/new"
                className="rounded-2xl border border-border-strong bg-paper-raised p-5 transition-colors hover:border-tide"
              >
                <p className="font-serif text-lg font-semibold">Post a job</p>
                <p className="mt-1 text-sm text-granite">
                  Part-time, apprenticeship, internship, temporary or seasonal.
                </p>
              </Link>
            ) : (
              <div className="rounded-2xl border border-border-strong bg-paper-raised p-5 opacity-60">
                <p className="font-serif text-lg font-semibold">Post a job</p>
                <p className="mt-1 text-sm text-granite">
                  Available once your business is verified.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={async () => {
              await logOut();
              router.push("/");
            }}
            className="mt-10 text-sm text-granite underline hover:text-tide cursor-pointer"
          >
            Log out
          </button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function VerificationBanner({ profile }: { profile: UserProfile }) {
  const [reapplying, setReapplying] = useState(false);
  const [justResubmitted, setJustResubmitted] = useState(false);

  if (profile.verificationStatus === "approved") {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-full bg-tide/10 px-4 py-2 text-sm font-medium text-tide w-fit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Verified
      </div>
    );
  }

  if (profile.verificationStatus === "rejected") {
    if (justResubmitted) {
      return (
        <div className="mt-6 rounded-2xl border border-border-strong bg-tide/10 px-5 py-4 text-sm text-tide">
          <p className="font-semibold">Resubmitted for review.</p>
          <p className="mt-1 text-ink">We&rsquo;ll be in touch once we&rsquo;ve had a look.</p>
        </div>
      );
    }

    return (
      <div className="mt-6 rounded-2xl border border-border-strong bg-gorse-bg px-5 py-4 text-sm text-ink">
        <p className="font-semibold text-gorse">Verification not approved</p>
        {profile.rejectionReason ? (
          <p className="mt-1 text-ink">&ldquo;{profile.rejectionReason}&rdquo;</p>
        ) : (
          <p className="mt-1 text-granite">
            Get in touch with us and we&rsquo;ll help sort this out.
          </p>
        )}
        {reapplying ? (
          <ReapplyForm profile={profile} onDone={() => setJustResubmitted(true)} />
        ) : (
          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setReapplying(true)}
              className="rounded-full bg-tide px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright cursor-pointer"
            >
              Update &amp; resubmit
            </button>
            <Link
              href="/contact"
              className="text-sm font-medium text-tide underline hover:text-tide-bright"
            >
              Contact us
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-border-strong bg-gorse-bg px-5 py-4 text-sm text-ink">
      <p className="font-semibold text-gorse">Verification pending</p>
      <p className="mt-1 text-granite">
        {profile.role === "job_seeker"
          ? "We're reviewing your details — you'll be able to apply to jobs once you're verified."
          : "We're reviewing your business — you'll be able to post jobs once you're verified."}
      </p>
    </div>
  );
}
