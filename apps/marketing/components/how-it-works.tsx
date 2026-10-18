const jobSeekerSteps = [
  {
    title: "Build your Potential Snapshot",
    body: "Skills, interests, qualifications, portfolio — the things that show who you are, not just where you've worked.",
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
    <section id="how-it-works" className="relative overflow-hidden border-b border-border px-6 py-20 sm:py-28">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(31,95,91,0.08)_0%,transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title="Two sides, one honest process."
          lede="Whether you're starting out or hiring someone who is, Tern keeps the path short and the trust real."
        />

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <StepCard label="For job seekers" steps={jobSeekerSteps} variant="dark" />
          <StepCard label="For employers" steps={employerSteps} variant="light" />
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

function StepCard({
  label,
  steps,
  variant,
}: {
  label: string;
  steps: { title: string; body: string }[];
  variant: "dark" | "light";
}) {
  const isDark = variant === "dark";

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border p-8 ${
        isDark ? "border-tide/20 bg-deep-raised text-[#ede9e2]" : "border-border bg-paper-raised"
      }`}
    >
      {isDark && <div className="bg-grain pointer-events-none absolute inset-0 opacity-[0.25]" aria-hidden="true" />}
      <h3
        className={`relative font-mono text-xs uppercase tracking-[0.1em] ${
          isDark ? "text-tide" : "text-gorse"
        }`}
      >
        {label}
      </h3>
      <ol className="relative mt-5 space-y-5">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span
              className={`shrink-0 font-serif text-[22px] font-bold tabular-nums ${
                isDark ? "text-tide" : "text-gorse"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className={`font-semibold ${isDark ? "text-[#ede9e2]" : "text-ink"}`}>
                {step.title}
              </p>
              <p className={`mt-1 text-[13.5px] ${isDark ? "text-[#c9d1cc]" : "text-granite"}`}>
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
