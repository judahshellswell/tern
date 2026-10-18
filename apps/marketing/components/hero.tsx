"use client";

import Link from "next/link";
import { useAuth } from "./auth/auth-provider";

// Deliberately always dark (bg-deep), independent of the site's own
// light/dark toggle — a fixed brand moment at the top of the page. Uses
// the --color-deep/--color-deep-raised tokens (globals.css) rather than
// hardcoded hex, so it still shifts correctly between the two themes
// instead of being pinned to one literal color pair.
export function Hero() {
  const { user, loading } = useAuth();

  return (
    <section className="relative overflow-hidden bg-deep pb-32 text-[#faf8f4] sm:pb-40">
      <HeroBackdrop />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-4 pt-16 md:grid-cols-[1.15fr_0.85fr] md:pt-24">
        <div className="animate-rise">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-gorse">
            <span className="h-1.5 w-1.5 rounded-full bg-gorse" />
            Launching first in Jersey
          </p>
          <h1 className="text-balance font-serif text-[3.2rem] font-bold leading-[0.96] tracking-tight sm:text-7xl">
            Your first shift
            <br />
            starts <span className="text-tide">here.</span>
          </h1>
          <p className="mt-7 max-w-[42ch] text-lg leading-relaxed text-[#c9d1cc]">
            Real part-time jobs, apprenticeships and seasonal work across
            Jersey — built for students, not CVs. Verified, safe, and
            genuinely yours.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-5">
            {!loading && user ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-gorse px-7 py-4 text-[16px] font-extrabold text-[#0a1513] shadow-[0_12px_28px_-8px_rgba(227,168,92,0.45)] transition-colors hover:bg-gorse/90"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-gorse px-7 py-4 text-[16px] font-extrabold text-[#0a1513] shadow-[0_12px_28px_-8px_rgba(227,168,92,0.45)] transition-colors hover:bg-gorse/90"
                >
                  Get started →
                </Link>
                <Link
                  href="/log-in"
                  className="text-sm font-semibold text-[#ede9e2] transition-colors hover:text-tide"
                >
                  Log in
                </Link>
              </>
            )}
          </div>

          <dl className="mt-11 flex flex-wrap gap-2.5 text-sm">
            <div>
              <dt className="sr-only">Minimum age</dt>
              <dd className="rounded-full border border-white/20 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#c9d1cc]">
                16+ · guardian-verified
              </dd>
            </div>
            <div>
              <dt className="sr-only">Employer visibility</dt>
              <dd className="rounded-full border border-white/20 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#c9d1cc]">
                Zero employer browsing
              </dd>
            </div>
            <div>
              <dt className="sr-only">Cost</dt>
              <dd className="rounded-full border border-white/20 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#c9d1cc]">
                Always free to apply
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative animate-rise [animation-delay:150ms]">
          <SnapshotCard />
        </div>
      </div>

      {/* Angled wave bleeding into the next section, instead of a hard
          rectangle edge — the page background color on each side so it
          seams invisibly whichever theme is active. */}
      <svg
        className="pointer-events-none absolute -bottom-px left-0 h-[70px] w-full text-paper sm:h-[100px]"
        viewBox="0 0 1360 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 100 L0 40 Q 340 100 680 40 T 1360 30 L1360 100 Z" fill="currentColor" />
      </svg>
    </section>
  );
}

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="bg-grain absolute inset-0 opacity-[0.35]" />
      <div className="absolute -right-44 -top-48 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(95,194,184,0.28)_0%,transparent_70%)]" />
      <div className="absolute -bottom-32 -left-48 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(227,168,92,0.2)_0%,transparent_70%)]" />
      <svg
        className="absolute right-10 top-14 h-[520px] w-[520px] text-tide opacity-40"
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
      <div className="-rotate-[2deg] rounded-[28px] border border-border-strong bg-paper-raised p-6 text-ink shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55)]">
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

      <div className="absolute -bottom-5 -left-8 rotate-[4deg] rounded-2xl bg-tide px-4 py-2.5 text-xs font-extrabold text-[#0a1513] shadow-[0_16px_32px_-8px_rgba(0,0,0,0.4)]">
        ✓ ID verified in &lt;10 min
      </div>
    </div>
  );
}
