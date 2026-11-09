import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { JobsBrowser } from "@/components/jobs/jobs-browser";
import { LAUNCH_GATE_ACTIVE } from "@/lib/launch-gate";

export const metadata: Metadata = {
  title: "Browse jobs — Tern",
  description:
    "Part-time, apprenticeship, internship, temporary and seasonal roles from verified employers in Jersey.",
};

export default function JobsPage() {
  if (LAUNCH_GATE_ACTIVE) redirect("/");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Browse jobs"
          title="What's open right now."
          lede="Every employer here is verified. No senior roles, no generic sprawl — just early-career work."
        />
        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <JobsBrowser />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
