import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { WaitlistCta } from "@/components/waitlist-cta";

export const metadata: Metadata = {
  title: "FAQ — Tern",
  description:
    "Answers to common questions about verification, safety, guardian consent, and how Tern works for job seekers and employers in Jersey.",
};

const groups: { heading: string; items: { q: string; a: string }[] }[] = [
  {
    heading: "Safety & trust",
    items: [
      {
        q: "Is this safe for my 16 or 17 year old?",
        a: "It's built specifically with that age group in mind. Anyone 16 or 17 needs a parent or guardian to confirm they know their child is using Tern before the account can go further than building a profile. There's no open messaging anywhere on the platform, and employers can only ever see people who've applied to their own vacancies — never a searchable list of candidates.",
      },
      {
        q: "How does guardian consent actually work?",
        a: "When a 16 or 17 year old signs up, we ask for a parent or guardian's name and email. That guardian gets a simple email with a one-tap confirmation — no account or app needed on their end. The job seeker can build their profile while this is pending, but can't apply to a job until both guardian consent and identity verification are complete.",
      },
      {
        q: "Can employers message candidates directly?",
        a: "Only through structured templates — interview invites, requests for more information, status updates — with typed fields like date pickers, not open text boxes. There's no way for anyone to send an arbitrary free-text message on Tern.",
      },
      {
        q: "Can an employer browse or search candidate profiles?",
        a: "No. This isn't a setting we might change later — there's no search-by-candidate feature anywhere in the product. Employers only ever see people who applied to their own job posting.",
      },
    ],
  },
  {
    heading: "For job seekers",
    items: [
      {
        q: "Do I need previous work experience?",
        a: "No — that's the point. Tern is built around a Potential Snapshot: your skills, interests, qualifications, portfolio, and even a short video introduction, instead of a work history you may not have yet.",
      },
      {
        q: "Is it free?",
        a: "Yes, free for job seekers.",
      },
      {
        q: "What kind of jobs are on Tern?",
        a: "Part-time jobs, apprenticeships, internships, temporary and seasonal work. Tern deliberately doesn't list senior or experienced-hire roles — it's scoped to early-career opportunities only.",
      },
      {
        q: "What's the minimum age?",
        a: "16, with guardian consent required for 16 and 17 year olds.",
      },
    ],
  },
  {
    heading: "For employers",
    items: [
      {
        q: "How long does employer verification take?",
        a: "We're reviewing every business by hand while we're small, which in practice means quickly — usually within a couple of days of submitting your registration details.",
      },
      {
        q: "What does it cost to post a job?",
        a: "Free, for now. We're pre-launch and focused on getting the product right before we think about pricing.",
      },
      {
        q: "Can I post a senior role?",
        a: "Not on Tern — it's scoped to part-time, apprenticeship, internship, temporary and seasonal roles only. If you're hiring for early-career positions, though, we'd love to have you.",
      },
    ],
  },
  {
    heading: "About the platform",
    items: [
      {
        q: "Why does Tern start in Jersey?",
        a: "Jersey is a small, tight-knit market — the right size to get verification and trust genuinely right before expanding. Guernsey and the wider Channel Islands are next, then the UK.",
      },
      {
        q: "When does Tern launch?",
        a: "We're building in public and opening to a small group of Jersey employers and candidates first. Join the waitlist and we'll email you the moment there's a place for you.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="FAQ"
          title="Questions people actually ask us."
          lede="If something's missing here, join the waitlist and reply to the confirmation email — we read every one."
        />

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl space-y-14">
            {groups.map((group) => (
              <div key={group.heading}>
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">
                  {group.heading}
                </p>
                <div className="mt-5 divide-y divide-border border-t border-border">
                  {group.items.map((item) => (
                    <details key={item.q} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg font-semibold text-ink marker:content-none">
                        {item.q}
                        <svg
                          className="h-4 w-4 shrink-0 text-granite-soft transition-transform group-open:rotate-45"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </summary>
                      <p className="mt-3 max-w-[65ch] text-[15px] text-granite">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <WaitlistCta />
      </main>
      <SiteFooter />
    </>
  );
}
