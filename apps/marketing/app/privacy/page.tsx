import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { LAUNCH_DATE_LABEL, LAUNCH_GATE_ACTIVE } from "@/lib/launch-gate";

export const metadata: Metadata = {
  title: "Privacy policy — Tern",
  description: "How Tern collects, stores, and protects your data.",
};

function PreLaunchPrivacyNotice() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Legal"
          title="Privacy notice"
          lede={`Tern has not launched yet. Until ${LAUNCH_DATE_LABEL}, this website does not collect, store or process personal data about its visitors.`}
        />

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-10 text-[15px] leading-relaxed text-ink">
            <div>
              <h2 className="font-serif text-xl font-semibold">What this website collects</h2>
              <p className="mt-3 text-granite">
                Nothing that identifies you. There are no accounts, sign-up
                forms, contact forms, mailing lists or job applications open
                on Tern before launch, and we do not use analytics,
                advertising or tracking cookies.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">What stays on your device</h2>
              <p className="mt-3 text-granite">
                If you switch between light and dark mode, that preference
                is saved in your own browser&rsquo;s local storage so the
                site remembers it. It never leaves your device and is not
                sent to us. You can clear it at any time through your
                browser settings.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Hosting</h2>
              <p className="mt-3 text-granite">
                Like any website, our hosting provider (Vercel) receives
                standard technical information needed to deliver pages to
                your browser, such as your IP address and browser type. This
                is used only to serve the site and keep it secure, and is
                not used by Tern to identify, profile or contact you.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">When Tern launches</h2>
              <p className="mt-3 text-granite">
                Before we open accounts on {LAUNCH_DATE_LABEL}, this page
                will be replaced with a full privacy notice explaining what
                personal data we collect, why, our lawful basis, how long we
                keep it, who we share it with, your rights under the Data
                Protection (Jersey) Law 2018 and how to contact us. We will
                not collect any personal data before that notice is
                published.
              </p>
            </div>
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
