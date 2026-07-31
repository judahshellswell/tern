import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/how-it-works";
import { WaitlistCta } from "@/components/waitlist-cta";

export const metadata: Metadata = {
  title: "For employers — Tern",
  description:
    "Post part-time, apprenticeship, internship, temporary and seasonal roles on Tern, and review verified early-career applicants — free while we build in Jersey.",
};

const steps = [
  {
    title: "Verify your business, once",
    body: "Submit your registration details and a proof of business. A person reviews every application — not an algorithm — so you're talking to us, not a queue.",
  },
  {
    title: "Post a role in under two minutes",
    body: "Choose a type — part-time, apprenticeship, internship, temporary or seasonal — and the form adapts to it. Transparent pay is required, not optional: it's one of the clearest trust signals a listing can give.",
  },
  {
    title: "Review real applicants on a simple board",
    body: "New, Reviewed, Shortlisted, Interview, Hired. Every card is a full Potential Snapshot — skills, portfolio, video intro, downloadable CV — from someone who chose to apply to you.",
  },
  {
    title: "Message through structured templates",
    body: "Invite to interview, request more information, send a status update. No open chat, no risk of a stray message going somewhere it shouldn't — professional by default.",
  },
];

const faqs = [
  {
    q: "What does it cost?",
    a: "Free, for now. We're pre-launch and focused on getting the product and the trust model right in Jersey before we think about pricing.",
  },
  {
    q: "Can I search or browse candidates directly?",
    a: "No — by design. You only ever see people who've applied to your own vacancies. It's the clearest way we can promise candidates, and their parents, that Tern isn't a place to be found by strangers.",
  },
  {
    q: "How long does verification take?",
    a: "We're reviewing every business by hand while we're small, which in practice means quickly — usually within a couple of days.",
  },
];

export default function EmployersPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="For employers"
          title="Hire for potential, not a name on a CV."
          lede="Tern gives you rich, honest candidate profiles from people who've already chosen to apply — verified, structured, and never a cold search."
        />

        <section className="border-b border-border px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow="How it works" title="From sign-up to shortlist." />
            <ol className="mt-12 grid gap-8 sm:grid-cols-2">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-border-strong bg-paper-raised p-6"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gorse-bg font-mono text-sm font-semibold tabular-nums text-gorse">
                    {i + 1}
                  </span>
                  <p className="mt-4 font-serif text-lg font-semibold">{step.title}</p>
                  <p className="mt-2 text-[15px] text-granite">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-border bg-paper-raised px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Job types"
              title="Built for early-career roles specifically."
              lede="Not a general job board. Tern is scoped to the roles where potential should count for more than a CV can show."
            />
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {["Part-time", "Apprenticeship", "Internship", "Temporary", "Seasonal"].map(
                (type) => (
                  <div
                    key={type}
                    className="rounded-2xl border border-border px-4 py-4 text-center font-serif text-base font-semibold"
                  >
                    {type}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="border-b border-border px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <SectionHeading eyebrow="Questions" title="What employers ask us." />
            <dl className="mt-10 space-y-8">
              {faqs.map((item) => (
                <div key={item.q}>
                  <dt className="font-serif text-lg font-semibold">{item.q}</dt>
                  <dd className="mt-2 text-[15px] text-granite">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <WaitlistCta defaultRole="employer" />
      </main>
      <SiteFooter />
    </>
  );
}
