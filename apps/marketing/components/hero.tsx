"use client";

import Link from "next/link";
import { useAuth } from "./auth/auth-provider";

// Fully theme-aware — no separate "always dark" surface. Light mode uses
// the normal light palette with tide-teal as the accent; dark mode
// inherits the site's own dark tokens, so there's no mismatched near-black
// band sitting apart from the rest of the page in either theme.
export function Hero() {
  const { user, loading } = useAuth();

  return (
    <section className="relative overflow-hidden border-b border-border bg-paper">
      <HeroBackdrop />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.15fr_0.85fr] md:pb-28 md:pt-24">
        <div className="animate-rise">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-strong bg-paper-raised px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-tide">
            <span className="h-1.5 w-1.5 rounded-full bg-gorse" />
            Launching first in Jersey
          </p>
          <h1 className="text-balance font-serif text-[3.2rem] font-bold leading-[0.96] tracking-tight sm:text-7xl">
            Your first shift
            <br />
            starts <span className="text-tide">here.</span>
          </h1>
          <p className="mt-7 max-w-[42ch] text-lg leading-relaxed text-granite">
            Real part-time jobs, apprenticeships and seasonal work across
            Jersey — built for students, not CVs. Verified, safe, and
            genuinely yours.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-5">
            {!loading && user ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-tide px-7 py-4 text-[16px] font-extrabold text-paper transition-colors hover:bg-tide-bright"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-tide px-7 py-4 text-[16px] font-extrabold text-paper transition-colors hover:bg-tide-bright"
                >
                  Get started →
                </Link>
                <Link
                  href="/log-in"
                  className="text-sm font-semibold text-ink transition-colors hover:text-tide"
                >
                  Log in
                </Link>
              </>
            )}
          </div>

          <dl className="mt-11 flex flex-wrap gap-2.5 text-sm">
            <div>
              <dt className="sr-only">Minimum age</dt>
              <dd className="rounded-full border border-border-strong px-3.5 py-1.5 font-mono text-xs font-semibold text-granite">
                16+ · guardian-verified
              </dd>
            </div>
            <div>
              <dt className="sr-only">Employer visibility</dt>
              <dd className="rounded-full border border-border-strong px-3.5 py-1.5 font-mono text-xs font-semibold text-granite">
                Zero employer browsing
              </dd>
            </div>
            <div>
              <dt className="sr-only">Cost</dt>
              <dd className="rounded-full border border-border-strong px-3.5 py-1.5 font-mono text-xs font-semibold text-granite">
                Always free to apply
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative animate-rise [animation-delay:150ms]">
          <SnapshotCard />
        </div>
      </div>
    </section>
  );
}

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="bg-grain absolute inset-0 opacity-[0.25]" />
      <div className="absolute -right-44 -top-48 h-[640px] w-[640px] rounded-full bg-tide/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-48 h-[480px] w-[480px] rounded-full bg-gorse/10 blur-3xl" />
      <svg
        className="absolute right-10 top-14 h-[520px] w-[520px] text-tide opacity-20"
        viewBox="0 0 560 560"
        fill="none"
      >
        <circle cx="280" cy="280" r="260" stroke="currentColor" strokeWidth="1" strokeDasharray="2 10" />
      </svg>
    </div>
  );
}

function SnapshotCard() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="-rotate-[2deg] rounded-[28px] border border-border-strong bg-paper-raised p-6 text-ink shadow-[0_1px_2px_rgba(18,33,30,0.06),0_24px_48px_-12px_rgba(18,33,30,0.18)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tide font-serif text-lg font-bold text-paper">
            JM
          </div>
          <div>
            <p className="font-serif text-base font-bold">Jayden Marsh</p>
            <p className="text-xs text-granite">St Saviour · Sixth form, Yr 12</p>
          </div>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-tide/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-tide">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20 6 9 17l-5-5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Verified
          </span>
        </div>

        <div className="mt-[18px] rounded-2xl bg-gradient-to-br from-gorse to-gorse/80 px-4 py-3.5 text-[13px] font-bold text-[#12211e]">
          🔥 3 new jobs match you this week
        </div>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {["Lifeguarding", "Café work"].map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-tide px-2.5 py-1 text-xs font-semibold text-paper"
            >
              {skill}
            </span>
          ))}
          <span className="rounded-full border border-border-strong px-2.5 py-1 text-xs font-semibold text-granite">
            Rugby
          </span>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-8 rotate-[4deg] rounded-2xl bg-tide px-4 py-2.5 text-xs font-extrabold text-paper shadow-[0_16px_32px_-8px_rgba(0,0,0,0.25)]">
        ✓ ID verified in &lt;10 min
      </div>
    </div>
  );
}
