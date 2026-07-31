import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Privacy policy — Tern",
  description: "How Tern collects, stores, and protects your data during our pre-launch waitlist.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Legal"
          title="Privacy policy"
          lede="Last updated 31 July 2026. This describes what we collect today, during our pre-launch waitlist — it will be replaced with a fuller policy before Tern opens for job seekers and employers."
        />

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-10 text-[15px] leading-relaxed text-ink">
            <div>
              <h2 className="font-serif text-xl font-semibold">What we collect right now</h2>
              <p className="mt-3 text-granite">
                At this stage, Tern is a waitlist. If you sign up, we
                collect your email address and whether you&rsquo;re
                joining as a job seeker or an employer. That&rsquo;s
                everything &mdash; there&rsquo;s no account, no profile,
                and no other personal data collected through this site
                yet.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">How it&rsquo;s stored</h2>
              <p className="mt-3 text-granite">
                Waitlist entries are stored in Firestore (Google Cloud),
                in a database configured for our Jersey launch. Access is
                restricted to Tern &mdash; there&rsquo;s no public or
                client-side path that can read this data.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">What we use it for</h2>
              <p className="mt-3 text-granite">
                Solely to email you when Tern opens in Jersey, and
                occasional updates about our launch. We don&rsquo;t sell,
                share, or use your email for anything else.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Your rights</h2>
              <p className="mt-3 text-granite">
                You can ask us to remove your email from the waitlist at
                any time &mdash; reply to any email we send you, or
                contact us directly, and we&rsquo;ll delete it promptly.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">When Tern launches</h2>
              <p className="mt-3 text-granite">
                Once job seekers and employers can create real accounts,
                this policy will be replaced with a complete version
                covering profile data, identity verification documents,
                guardian consent records, applications, and messaging
                &mdash; written for Jersey&rsquo;s data protection law
                (the DPJL) and reviewed accordingly before launch.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Contact</h2>
              <p className="mt-3 text-granite">
                Questions about this policy or your data can be sent to
                the address you received our waitlist confirmation from.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
