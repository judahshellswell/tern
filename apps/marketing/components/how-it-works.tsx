const jobSeekerSteps = [
  {
    title: "Build your Potential Snapshot",
    body: "Skills, interests, qualifications, portfolio, even a short video intro — the things that show who you are, not just where you've worked.",
  },
  {
    title: "Get verified, with a guardian if you're 16 or 17",
    body: "A quick ID check, plus a simple consent step for a parent or guardian. No stranger reaches you until this is done.",
  },
  {
    title: "Apply in one tap",
    body: "Your profile and CV attach automatically. Add a short note if you want to — that's it, under 90 seconds.",
  },
];

const employerSteps = [
  {
    title: "Verify your business",
    body: "Submit your registration details once. Every business on Tern is reviewed before they can post — so every applicant trusts you back.",
  },
  {
    title: "Post a role in under two minutes",
    body: "Pick a type — part-time, apprenticeship, internship, temporary or seasonal — and the form adapts. Transparent pay is required, not optional.",
  },
  {
    title: "Review real applicants, not a CV pile",
    body: "Rich candidate profiles, downloadable CVs, and a shortlist board. You never browse — only people who actually applied.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title="Two sides, one honest process."
          lede="Whether you're starting out or hiring someone who is, Tern keeps the path short and the trust real."
        />

        <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-14">
          <StepList label="For job seekers" steps={jobSeekerSteps} accent="tide" />
          <StepList label="For employers" steps={employerSteps} accent="gorse" />
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">{eyebrow}</p>
      <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {lede && <p className="mt-4 text-lg text-granite">{lede}</p>}
    </div>
  );
}

function StepList({
  label,
  steps,
  accent,
}: {
  label: string;
  steps: { title: string; body: string }[];
  accent: "tide" | "gorse";
}) {
  return (
    <div>
      <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-granite-soft">
        {label}
      </h3>
      <ol className="mt-5 space-y-6">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold tabular-nums ${
                accent === "tide"
                  ? "bg-tide/10 text-tide"
                  : "bg-gorse-bg text-gorse"
              }`}
            >
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-ink">{step.title}</p>
              <p className="mt-1 text-[15px] text-granite">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
