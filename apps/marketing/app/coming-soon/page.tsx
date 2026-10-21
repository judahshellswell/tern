import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LAUNCH_DATE_LABEL } from "@/lib/launch-gate";

export const metadata: Metadata = {
  title: "Coming soon — Tern",
  description: `Tern is launching ${LAUNCH_DATE_LABEL}. Accounts aren't open yet.`,
};

export default function ComingSoonPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl animate-rise text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-paper-raised px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-tide">
              <span className="h-1.5 w-1.5 rounded-full bg-gorse" />
              Launching {LAUNCH_DATE_LABEL}
            </p>
            <h1 className="mt-5 text-balance font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Accounts open {LAUNCH_DATE_LABEL}.
            </h1>
            <p className="mx-auto mt-5 max-w-[55ch] text-lg text-granite">
              We&rsquo;re not collecting any sign-ups or personal details yet —
              Tern opens for job seekers and employers in Jersey on{" "}
              {LAUNCH_DATE_LABEL}. You can still browse what&rsquo;s coming
              below.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/jobs"
                className="rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright"
              >
                Browse jobs
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-ink transition-colors hover:text-tide"
              >
                About Tern
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
