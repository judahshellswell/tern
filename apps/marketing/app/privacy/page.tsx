import type { Metadata } from "next";
import type React from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { LAUNCH_GATE_ACTIVE } from "@/lib/launch-gate";

export const metadata: Metadata = {
  title: "Privacy policy — Tern",
  description: "How Tern collects, stores, and protects your data.",
};

const PRE_LAUNCH_LAST_UPDATED = "5 November 2026";

const preLaunchSections: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "Who we are",
    body: (
      <p>
        Tern is a recruitment platform for Jersey that has not launched yet.
        It is run by Judah Shellswell, a sole trader based in Jersey, trading
        as &ldquo;Tern&rdquo;. For the purposes of the Data Protection
        (Jersey) Law 2018, Judah Shellswell is the controller of any personal
        data processed through this website.
      </p>
    ),
  },
  {
    heading: "What we collect right now",
    body: (
      <>
        <p>
          While Tern is in its pre-launch period, we do not collect or store
          any personal data about visitors. There are no accounts, sign-up
          forms, contact forms, mailing lists or job applications open on
          this website, and we do not ask you for your name, email address or
          any other details.
        </p>
        <p className="mt-3">
          We do not use analytics, advertising, tracking or profiling tools,
          and we do not set cookies.
        </p>
      </>
    ),
  },
  {
    heading: "Technical data handled by our service providers",
    body: (
      <>
        <p>
          Like any website, delivering pages to your browser means our
          service providers receive standard technical information, such as
          your IP address, browser type and the time of your request:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-ink">Vercel Inc.</strong>{" "}
            hosts this website and serves its pages.
          </li>
          <li>
            <strong className="font-semibold text-ink">
              Google Cloud (Firebase)
            </strong>{" "}
            delivers the job listings and images you can browse on the site.
          </li>
        </ul>
        <p className="mt-3">
          This information is used only to deliver the website to you and to
          keep it secure and working. Our lawful basis is our legitimate
          interest in operating a functioning, secure website. Tern does not
          use this information to identify, contact, profile or market to
          you. Any short-lived technical logs are kept by these providers
          under their own security and retention practices.
        </p>
      </>
    ),
  },
  {
    heading: "Where data is processed",
    body: (
      <p>
        Vercel and Google operate globally, so technical data may be
        processed outside Jersey, including in the United Kingdom, the
        European Economic Area and the United States. Where data leaves
        Jersey, it is protected by the safeguards these providers put in
        place for international transfers, such as standard contractual
        clauses.
      </p>
    ),
  },
  {
    heading: "Storage on your device",
    body: (
      <p>
        If you switch between light and dark mode, that preference is saved
        in your own browser&rsquo;s local storage so the site remembers it.
        The site&rsquo;s software components may also keep small amounts of
        non-identifying technical data in your browser so the site works
        properly. None of this is sent to Tern or used to track you, and you
        can clear it at any time through your browser settings.
      </p>
    ),
  },
  {
    heading: "Children",
    body: (
      <p>
        Tern will be open to people aged 16 and over once it launches. During
        the pre-launch period we do not collect personal data from anyone,
        of any age.
      </p>
    ),
  },
  {
    heading: "Automated decisions",
    body: (
      <p>
        We do not make any automated decisions or carry out any profiling
        about visitors to this website.
      </p>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <>
        <p>
          Under the Data Protection (Jersey) Law 2018 you have rights over
          your personal data, including the right to be informed, to access
          it, to have it corrected or erased, to restrict or object to its
          processing, and to data portability. Because Tern does not collect
          or hold personal data about visitors during the pre-launch period,
          we have no personal data about you to access, correct or erase.
        </p>
        <p className="mt-3">
          If you have concerns about how your personal data is handled, you
          have the right to complain to the Jersey Office of the Information
          Commissioner (JOIC) at{" "}
          <a
            href="https://jerseyoic.org"
            className="text-tide underline hover:text-tide-bright"
            rel="noopener noreferrer"
            target="_blank"
          >
            jerseyoic.org
          </a>
          .
        </p>
      </>
    ),
  },
  {
    heading: "Changes to this notice",
    body: (
      <p>
        Before Tern opens accounts, this notice will be replaced with a full
        privacy policy explaining what personal data we will collect, why, our
        lawful basis, who we share it with, how long we keep it, your rights
        and how to contact us. We will not collect any personal data before
        that policy is published on this page.
      </p>
    ),
  },
];

function PreLaunchPrivacyNotice() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Legal"
          title="Privacy notice"
          lede={`Last updated ${PRE_LAUNCH_LAST_UPDATED}. Tern has not launched yet, and this website does not collect or store personal data about its visitors. This notice explains exactly what happens when you visit.`}
        />

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-10 text-[15px] leading-relaxed text-ink">
            {preLaunchSections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-serif text-xl font-semibold">{section.heading}</h2>
                <div className="mt-3 text-granite">{section.body}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export default function PrivacyPage() {
  if (LAUNCH_GATE_ACTIVE) return <PreLaunchPrivacyNotice />;
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Legal"
          title="Privacy policy"
          lede="Last updated 21 October 2026. This describes what Tern collects today. We're a small, early platform in Jersey, and this will be reviewed against Jersey's data protection law (the DPJL) as we grow — it isn't a substitute for formal legal advice."
        />

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-10 text-[15px] leading-relaxed text-ink">
            <div>
              <h2 className="font-serif text-xl font-semibold">What we collect</h2>
              <p className="mt-3 text-granite">
                When you create an account, we collect: for job seekers,
                your name, date of birth, and location; for employers,
                your business name and registration number. When you
                post a job or apply to one, we store that job or
                application.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">How it&rsquo;s stored</h2>
              <p className="mt-3 text-granite">
                Everything is stored in Firestore (Google Cloud). Job
                seeker and employer accounts start unverified and stay
                that way until Tern reviews them &mdash; verification
                data is only visible to Tern, never to other users.
                Published jobs are public; applications are visible only
                to the applicant and the employer they applied to.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">What we use it for</h2>
              <p className="mt-3 text-granite">
                To run the platform &mdash; verifying accounts, showing
                jobs, handling applications &mdash; and to email you
                about your account or Tern&rsquo;s launch. We don&rsquo;t
                sell your data, and employers never see job seeker data
                beyond what a candidate submits when they apply.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Your rights</h2>
              <p className="mt-3 text-granite">
                You can ask us to see, correct, or delete your data at
                any time &mdash; contact us and we&rsquo;ll action it
                promptly.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Contact</h2>
              <p className="mt-3 text-granite">
                Questions about this policy or your data can be sent to{" "}
                <a href="mailto:hello@tern.je" className="text-tide underline hover:text-tide-bright">
                  hello@tern.je
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
