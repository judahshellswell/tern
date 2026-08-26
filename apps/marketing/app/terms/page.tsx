import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Terms of service — Tern",
  description: "Terms covering accounts, verification, and job postings on Tern.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Legal"
          title="Terms of service"
          lede="Last updated 26 August 2026. We're a small, early platform in Jersey — this describes how Tern actually works today. It isn't a substitute for formal legal advice, and we'll expand it as the platform grows."
        />

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl space-y-10 text-[15px] leading-relaxed text-ink">
            <div>
              <h2 className="font-serif text-xl font-semibold">Who can use Tern</h2>
              <p className="mt-3 text-granite">
                Job seekers must be 16 or older. If you&rsquo;re 16 or 17,
                a parent or guardian must confirm they know you&rsquo;re
                using Tern before you can apply to any job. Employers must
                be a real, verifiable business.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Verification</h2>
              <p className="mt-3 text-granite">
                Every account is reviewed before it can do anything that
                affects someone else &mdash; a job seeker can&rsquo;t apply
                and an employer can&rsquo;t publish a job until Tern
                approves their account. We can reject or ask for more
                information at our discretion, and we can suspend an
                account that misrepresents who they are.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Job postings &amp; applications</h2>
              <p className="mt-3 text-granite">
                Employers are responsible for the accuracy of the roles
                they post. Applying to a job through Tern doesn&rsquo;t
                guarantee an interview or a job offer &mdash; Tern
                connects candidates and employers, but the hiring
                decision is always the employer&rsquo;s.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Acceptable use</h2>
              <p className="mt-3 text-granite">
                Don&rsquo;t misrepresent your identity, your age, or your
                business. Don&rsquo;t use Tern to contact job seekers or
                employers outside the platform&rsquo;s intended use. We
                can suspend or remove accounts that put other users at
                risk.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Changes</h2>
              <p className="mt-3 text-granite">
                Tern is early and these terms will keep evolving as the
                platform grows &mdash; particularly as we add more
                territories beyond Jersey. We&rsquo;ll post updates here,
                and they apply from the date they&rsquo;re published.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold">Contact</h2>
              <p className="mt-3 text-granite">
                Questions about these terms can be sent to{" "}
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
