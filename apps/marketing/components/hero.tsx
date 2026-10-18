"use client";

import Link from "next/link";
import { useAuth } from "./auth/auth-provider";

// Deliberately always dark, independent of the site's light/dark toggle —
// a high-energy brand moment at the top of the page, not a themed surface.
// Colors are the same tide/gorse tokens as the rest of the site, just the
// fixed dark-mode values (see globals.css), so it stays on-palette even
// though it isn't reading the CSS variables.
export function Hero() {
  const { user, loading } = useAuth();

  return (
    <section className="relative overflow-hidden bg-[#12211e] text-[#faf8f4]">
      <DiagonalBackdrop />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.15fr_0.85fr] md:pb-28 md:pt-24">
        <div className="animate-rise">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[#e3a85c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e3a85c]" />
            Launching first in Jersey
          </p>
          <h1 className="text-balance font-serif text-[3.2rem] font-bold leading-[0.96] tracking-tight sm:text-7xl">
            Your first shift
            <br />
            starts <span className="text-[#5fc2b8]">here.</span>
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
                className="rounded-full bg-[#e3a85c] px-7 py-4 text-[16px] font-extrabold text-[#12211e] transition-colors hover:bg-[#f0bb77]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-[#e3a85c] px-7 py-4 text-[16px] font-extrabold text-[#12211e] transition-colors hover:bg-[#f0bb77]"
                >
                  Get started →
                </Link>
                <Link
                  href="/log-in"
                  className="text-sm font-semibold text-[#ede9e2] transition-colors hover:text-[#5fc2b8]"
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
    </section>
  );
}

function DiagonalBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute -right-56 -top-32 h-[480px] w-[480px] rotate-[18deg] rounded-[48px] bg-gradient-to-br from-[#1f5f5b] to-[#0f1c19] opacity-90" />
      <div className="absolute -bottom-44 -left-40 h-[420px] w-[420px] rounded-full bg-[#b87418] opacity-[0.14] blur-[2px]" />
    </div>
  );
}

function SnapshotCard() {
  return (
    <div className="mx-auto w-full max-w-sm -rotate-[2deg] rounded-[28px] bg-[#faf8f4] p-6 text-[#12211e] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1f5f5b] font-serif text-lg font-bold text-[#faf8f4]">
          JM
        </div>
        <div>
          <p className="font-serif text-base font-bold">Jayden Marsh</p>
          <p className="text-xs text-[#6b7570]">St Saviour · Sixth form, Yr 12</p>
        </div>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-[#1f5f5b]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-[#1f5f5b]">
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

      <div className="mt-[18px] rounded-2xl bg-[#e3a85c] px-4 py-3.5 text-[13px] font-bold text-[#12211e]">
        🔥 3 new jobs match you this week
      </div>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {["Lifeguarding", "Café work"].map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-[#1f5f5b] px-2.5 py-1 text-xs font-semibold text-[#faf8f4]"
          >
            {skill}
          </span>
        ))}
        <span className="rounded-full border border-[#d9d2c3] px-2.5 py-1 text-xs font-semibold text-[#44504a]">
          Rugby
        </span>
      </div>
    </div>
  );
}
