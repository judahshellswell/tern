import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { PostJobForm } from "@/components/employer/post-job-form";

export const metadata: Metadata = {
  title: "Post a job — Tern",
  description: "Post a part-time, apprenticeship, internship, temporary or seasonal role.",
};

export default function NewJobPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="For employers"
          title="Post a job."
          lede="Transparent pay is required, not optional — it's one of the clearest trust signals a listing can give."
        />
        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-xl">
            <PostJobForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
