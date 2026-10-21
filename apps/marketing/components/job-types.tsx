const types = [
  { label: "Part-time", note: "Weekly, ongoing", variant: "tide" as const },
  { label: "Apprenticeship", note: "Earn while you train", variant: "plain" as const },
  { label: "Internship", note: "Fixed-term, hands-on", variant: "plain" as const },
  { label: "Temporary", note: "Short cover roles", variant: "plain" as const },
  { label: "Seasonal", note: "Summer & festive", variant: "gorse" as const },
];

const variantClasses = {
  tide: "bg-tide text-paper",
  gorse: "bg-gorse text-[#12211e]",
  plain: "bg-paper-raised text-ink",
};

const noteClasses = {
  tide: "text-paper/70",
  gorse: "text-[#12211e]/65",
  plain: "text-granite-soft",
};

export function JobTypes() {
  return (
    <section className="bg-paper px-6 pb-18">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-granite-soft">
          What&rsquo;s on Tern — deliberately not everything
        </p>
        <div className="mt-5 grid grid-cols-2 gap-[2px] overflow-hidden rounded-[20px] shadow-[0_1px_2px_rgba(18,33,30,0.06),0_16px_32px_-16px_rgba(18,33,30,0.2)] sm:grid-cols-5">
          {types.map((type) => (
            <div
              key={type.label}
              className={`px-4 py-6 text-center ${variantClasses[type.variant]}`}
            >
              <p className="font-serif text-base font-semibold">{type.label}</p>
              <p className={`mt-1 font-mono text-[11px] ${noteClasses[type.variant]}`}>
                {type.note}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-[60ch] text-sm text-granite">
          No senior roles, no generic job-board sprawl. Tern is built for
          career stage, not age — anyone taking their next step into
          part-time or entry-level work, whatever stage of life they&rsquo;re at.
        </p>
      </div>
    </section>
  );
}
