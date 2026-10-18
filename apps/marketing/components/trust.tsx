const pillars = [
  {
    title: "Verified before anything else",
    body: "Employers can't publish and job seekers can't apply until they're verified. It's the one gate everything else sits behind.",
    accent: "tide" as const,
  },
  {
    title: "Guardian consent for 16 &amp; 17 year olds",
    body: "A parent or guardian confirms they know their child is using Tern, before an account can go further than building a profile.",
    accent: "tide" as const,
  },
  {
    title: "No employer browsing, ever",
    body: "Employers only ever see candidates who applied to their own vacancies. There's no search-by-candidate feature anywhere in Tern — by design, not by setting.",
    accent: "tide" as const,
  },
  {
    title: "No open messaging",
    body: "Every message is a structured template — interview invites, information requests, status updates. No free text, no unsupervised chat, no way for a stranger to just message a candidate.",
    accent: "gorse" as const,
  },
];

export function Trust() {
  return (
    <section id="trust" className="relative overflow-hidden border-b border-border bg-paper-raised px-6 py-20 sm:py-28">
      <div className="bg-grain pointer-events-none absolute inset-0 opacity-[0.3]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">Trust &amp; safety</p>
          <h2 className="text-balance mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Built to be trusted by parents, not just users.
          </h2>
          <p className="mt-4 max-w-[38ch] text-lg text-granite">
            In a small community, reputations travel fast. Tern&rsquo;s safety
            model isn&rsquo;t a feature list bolted on afterward — it&rsquo;s
            the architecture.
          </p>
          <div className="mt-8 inline-flex w-fit items-center gap-3 rounded-2xl bg-gorse-bg px-5 py-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-gorse">
              <path
                d="M12 2 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[13px] font-bold text-gorse">
              Guardian consent required, 16–17
            </span>
          </div>
        </div>

        <div className="relative flex flex-col">
          <div
            className="absolute bottom-6 left-5 top-6 w-px bg-gradient-to-b from-tide to-gorse"
            aria-hidden="true"
          />
          {pillars.map((pillar, i) => (
            <div key={pillar.title} className="flex gap-5 py-5">
              <span
                className={`z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold tabular-nums ${
                  pillar.accent === "tide" ? "bg-tide text-paper" : "bg-gorse text-[#12211e]"
                }`}
              >
                {i + 1}
              </span>
              <div>
                <h3
                  className="font-serif text-lg font-semibold"
                  dangerouslySetInnerHTML={{ __html: pillar.title }}
                />
                <p className="mt-1.5 max-w-[48ch] text-[14.5px] text-granite">{pillar.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
