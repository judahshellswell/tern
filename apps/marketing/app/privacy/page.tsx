import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Privacy policy — Tern",
  description: "How Tern collects, stores, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Legal"
          title="Privacy policy"
          lede="Last updated 26 August 2026. This describes what Tern collects today. We're a small, early platform in Jersey, and this will be reviewed against Jersey's data protection law (the DPJL) as we grow — it isn't a substitute for formal legal advice."
        />

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-10 text-[15px] leading-relaxed text-ink">
            <div>
              <h2 className="font-serif text-xl font-semibold">What we collect</h2>
              <p className="mt-3 text-granite">
                When you create an account, we collect: for job seekers,
                your name, date of birth, location, and (if you&rsquo;re
                16 or 17) a parent or guardian&rsquo;s email for consent;
                for employers, your business name and registration
                number. When you post a job or apply to one, we store
                that job or application.
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
              <h2 className="font-serif text-xl font-semibold">Guardian consent</h2>
              <p className="mt-3 text-granite">
                If you&rsquo;re 16 or 17, we ask for a parent or
                guardian&rsquo;s email so they can confirm they know
                you&rsquo;re using Tern. We use that email only for
                consent and account-related communication.
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
