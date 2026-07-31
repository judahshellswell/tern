import { SectionHeading } from "./how-it-works";

const stats = [
  { value: "<2 min", label: "To post a role" },
  { value: "100%", label: "Employers verified before publishing" },
  { value: "0", label: "Candidates you can cold-browse" },
];

export function EmployerPitch() {
  return (
    <section id="employers" className="border-b border-border bg-paper-raised px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[1fr_0.85fr] md:items-center">
          <div>
            <SectionHeading
              eyebrow="For employers"
              title="Hire for potential, not a name on a CV."
              lede="Tern gives you rich, honest candidate profiles — skills, projects, video intros — from people who've already chosen to apply. Less filtering, more signal."
            />
            <ul className="mt-8 space-y-3 text-[15px] text-ink">
              {[
                "Post part-time, apprenticeship, internship, temporary and seasonal roles",
                "Review applicants on a simple shortlist board — New, Reviewed, Shortlisted, Interview, Hired",
                "Download CVs and message through structured, professional templates",
                "Every applicant already verified, so you're never guessing",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <svg
                    className="mt-1 h-4 w-4 shrink-0 text-tide"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M20 6 9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-1">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border-strong bg-paper px-6 py-6 text-center md:text-left"
              >
                <p className="font-serif text-3xl font-semibold tabular-nums text-tide">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-granite">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
