const types = [
  { label: "Part-time", note: "Weekly, ongoing" },
  { label: "Apprenticeship", note: "Earn while you train" },
  { label: "Internship", note: "Fixed-term, hands-on" },
  { label: "Temporary", note: "Short cover roles" },
  { label: "Seasonal", note: "Summer & festive" },
];

export function JobTypes() {
  return (
    <section className="border-b border-border bg-paper-raised px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-granite-soft">
          What&rsquo;s on Tern — deliberately not everything
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {types.map((type) => (
            <div
              key={type.label}
              className="rounded-2xl border border-border px-4 py-4 text-center"
            >
              <p className="font-serif text-base font-semibold">{type.label}</p>
              <p className="mt-1 font-mono text-[11px] text-granite-soft">{type.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-[60ch] text-sm text-granite">
          No senior roles, no generic job-board sprawl. Tern is built for
          career stage, not age — school leavers, students, apprentices, and
          anyone taking their first real step.
        </p>
      </div>
    </section>
  );
}
