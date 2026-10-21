import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Tern",
  description:
    "Why Tern exists, and why it starts in Jersey: a recruitment platform built around potential, not experience.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="About Tern"
          title="Potential deserves a real chance."
          lede="Most recruitment tools are built for people who already have a long work history. Tern is built for everyone else."
        />

        <section className="border-b border-border px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-6 text-[17px] leading-relaxed text-ink">
            <p>
              Whether you&rsquo;re 16, or starting again at 40, the problem
              is the same: every job platform is built around work history
              you might not have, or might not have in this field. Job
              boards filter on experience. Recruiters look for a track
              record. And the people most capable of surprising an
              employer &mdash; reliable, curious, ready to learn &mdash;
              get filtered out before anyone actually looks at them.
            </p>
            <p>
              Tern exists to fix that specific problem. Not senior hiring,
              not general recruitment &mdash; just part-time jobs,
              apprenticeships, internships, temporary and seasonal work.
              The roles where potential should matter more than a CV can
              show.
            </p>
          </div>
        </section>

        <section className="border-b border-border bg-paper-raised px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-6 text-[17px] leading-relaxed text-ink">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">
              Why Jersey, first
            </p>
            <h2 className="text-balance font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              Small enough to get right, before it needs to scale.
            </h2>
            <p>
              Jersey is a small, tight-knit island economy &mdash; the kind
              of place where trust matters more than in a market where
              nobody knows anybody. That&rsquo;s exactly why we&rsquo;re
              starting here. We can verify every employer by hand. We can
              talk to the community directly. We can get it right at a
              scale where getting it wrong would be immediately obvious
              &mdash; before taking that same care to Guernsey, to the
              wider Channel Islands, and eventually the UK.
            </p>
            <p>
              It&rsquo;s not a limitation. It&rsquo;s the only honest way
              to build something people should trust with their next job.
            </p>
          </div>
        </section>

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-6 text-[17px] leading-relaxed text-ink">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">
              What we believe
            </p>
            <h2 className="text-balance font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              Potential over experience.
            </h2>
            <p>
              A candidate&rsquo;s skills, interests, projects, and
              character say more about what they&rsquo;ll become than
              where they&rsquo;ve already worked. So Tern is built around
              a Potential Snapshot, not a CV &mdash; and around
              verification and safety that make it genuinely trustworthy,
              whoever&rsquo;s using it.
            </p>
          </div>
        </section>

        <section className="px-6 py-16 text-center sm:py-20">
          <div className="mx-auto max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">Get started</p>
            <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to take the next step?
            </h2>
            <Link
              href="/sign-up"
              className="mt-8 inline-block rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright"
            >
              Sign up
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
