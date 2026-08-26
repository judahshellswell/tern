import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Contact — Tern",
  description: "Get in touch with Tern — questions, feedback, or anything else.",
};

const CONTACT_EMAIL = "hello@tern.je";

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Get in touch"
          title="Questions? We read every email."
          lede="Whether you're a student, a parent, an employer, or just curious about Tern — send us a message and we'll get back to you."
        />

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-border-strong bg-paper-raised p-8 text-center sm:p-10">
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-granite-soft">
                Email us directly
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-3 inline-block font-serif text-2xl font-semibold text-tide transition-colors hover:text-tide-bright sm:text-3xl"
              >
                {CONTACT_EMAIL}
              </a>
              <p className="mt-4 text-[15px] text-granite">
                For anything &mdash; general questions, employer or job
                seeker verification queries, press, or feedback on the
                site.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="font-serif text-lg font-semibold">Parents &amp; guardians</h2>
                <p className="mt-2 text-[15px] text-granite">
                  If you have questions about guardian consent or your
                  child&rsquo;s account, email us and mention their name
                  and account email so we can find it quickly.
                </p>
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold">Employers</h2>
                <p className="mt-2 text-[15px] text-granite">
                  Questions about verification, posting a role, or
                  anything else &mdash; we usually reply within a couple
                  of days.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
