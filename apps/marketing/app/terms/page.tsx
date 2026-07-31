import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Terms of service — Tern",
  description: "Terms covering Tern's pre-launch waitlist.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Legal"
          title="Terms of service"
          lede="Last updated 31 July 2026. These terms cover our pre-launch waitlist only — full terms for job seekers and employers will be published before Tern opens."
        />

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-10 text-[15px] leading-relaxed text-ink">
            <div>
              <h2 className="font-serif text-xl font-semibold">What joining the waitlist means</h2>
              <p className="mt-3 text-granite">
                Joining the Tern waitlist reserves you early access and
                adds you to our launch mailing list. It doesn&rsquo;t
                create an account, and it isn&rsquo;t a commitment on
                either side &mdash; you can ask to be removed at any time,
                and joining doesn&rsquo;t guarantee access on any
                particular date.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">No service is live yet</h2>
              <p className="mt-3 text-granite">
                Tern&rsquo;s job seeker and employer product hasn&rsquo;t
                launched. Nothing on this site should be read as an offer
                of employment, a job listing, or a verified employer or
                candidate profile &mdash; that functionality doesn&rsquo;t
                exist yet.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Changes</h2>
              <p className="mt-3 text-granite">
                We may update these terms as we get closer to launch.
                We&rsquo;ll post the new version here, and it applies from
                the date it&rsquo;s published.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Full terms at launch</h2>
              <p className="mt-3 text-granite">
                Once job seekers and employers can create real accounts,
                these terms will be replaced with a complete version
                covering account use, verification, job postings,
                applications, and platform rules for both Jersey launch
                and the territories that follow.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Contact</h2>
              <p className="mt-3 text-granite">
                Questions about these terms can be sent to the address you
                received our waitlist confirmation from.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
