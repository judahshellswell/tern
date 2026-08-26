import { WaitlistForm } from "./waitlist-form";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <TideBackdrop />
      <div className="relative mx-auto grid max-w-6xl gap-14 px-6 pb-20 pt-16 md:grid-cols-[1.1fr_0.9fr] md:pb-28 md:pt-24">
        <div className="animate-rise">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border-strong bg-paper-raised px-3 py-1 font-mono text-xs uppercase tracking-[0.1em] text-tide">
            <span className="h-1.5 w-1.5 rounded-full bg-gorse" />
            Launching first in Jersey
          </p>
          <h1 className="text-balance font-serif text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Find your first move.
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg text-granite">
            Tern is Jersey&rsquo;s job platform for students and early-career
            talent — verified part-time jobs, apprenticeships, internships
            and seasonal work, built around potential, not experience.
          </p>

          <div className="mt-10 max-w-md">
            <WaitlistForm />
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="sr-only">Minimum age</dt>
              <dd className="font-mono text-xs text-granite-soft">
                16+, guardian-verified
              </dd>
            </div>
            <div>
              <dt className="sr-only">Employer visibility</dt>
              <dd className="font-mono text-xs text-granite-soft">
                No employer browsing — ever
              </dd>
            </div>
            <div>
              <dt className="sr-only">Cost</dt>
              <dd className="font-mono text-xs text-granite-soft">
                Free for job seekers
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

function TideBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div className="absolute -left-24 top-[-120px] h-[420px] w-[420px] rounded-full bg-tide/10 blur-3xl" />
      <div className="absolute right-[-140px] top-[80px] h-[360px] w-[360px] rounded-full bg-gorse/10 blur-3xl" />
    </div>
  );
}

function SnapshotCard() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[28px] border border-border-strong bg-paper-raised p-6 shadow-[0_1px_2px_rgba(18,33,30,0.06),0_24px_48px_-12px_rgba(18,33,30,0.18)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tide font-serif text-lg font-semibold text-paper">
          AM
        </div>
        <div>
          <p className="font-serif text-base font-semibold">Amelie Marett</p>
          <p className="text-xs text-granite">St Helier · Sixth form, Yr 13</p>
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

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          ["6", "Skills"],
          ["Wknds", "Availability"],
          ["GCSE+", "Level"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-xl bg-paper px-2 py-3">
            <p className="font-serif text-lg font-semibold tabular-nums">{value}</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-granite-soft">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {["Customer service", "Teamwork", "Reliability"].map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-tide px-2.5 py-1 text-xs font-medium text-paper"
          >
            {skill}
          </span>
        ))}
        {["Photography", "Netball"].map((interest) => (
          <span
            key={interest}
            className="rounded-full border border-border-strong px-2.5 py-1 text-xs font-medium text-granite"
          >
            {interest}
          </span>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-dashed border-border-strong px-3 py-2.5 text-xs text-granite">
        Recommended for:{" "}
        <span className="font-medium text-ink">Weekend retail assistant</span>
        <br />
        <span className="text-granite-soft">
          because your customer service and teamwork skills match this role
        </span>
      </div>
    </div>
  );
}
