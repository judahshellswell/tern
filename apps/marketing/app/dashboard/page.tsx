"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { logOut } from "@/lib/auth-actions";
import { useRouter } from "next/navigation";

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

          <VerificationBanner status={profile.verificationStatus} role={profile.role} />

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

function VerificationBanner({
  status,
  role,
}: {
  status: "pending" | "approved" | "rejected";
  role: "job_seeker" | "employer";
}) {
  if (status === "approved") {
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

  if (status === "rejected") {
    return (
      <div className="mt-6 rounded-2xl border border-border-strong bg-gorse-bg px-5 py-4 text-sm text-ink">
        <p className="font-semibold text-gorse">Verification not approved</p>
        <p className="mt-1 text-granite">
          Get in touch with us and we&rsquo;ll help sort this out.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-border-strong bg-gorse-bg px-5 py-4 text-sm text-ink">
      <p className="font-semibold text-gorse">Verification pending</p>
      <p className="mt-1 text-granite">
        {role === "job_seeker"
          ? "We're reviewing your details — you'll be able to apply to jobs once you're verified."
          : "We're reviewing your business — you'll be able to post jobs once you're verified."}
      </p>
    </div>
  );
}
