import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { LAUNCH_GATE_ACTIVE } from "@/lib/launch-gate";

export const metadata: Metadata = {
  title: "Sign up — Tern",
  description: "Create a Tern account as a job seeker or an employer.",
};

export default function SignUpPage() {
  // --- TEMPORARY pre-launch gate, remove this block on launch day ---
  if (LAUNCH_GATE_ACTIVE) redirect("/coming-soon");
  // --- end temporary block ---

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Get started"
          title="Create your account."
          lede="Job seekers and employers both start here — verification comes next, before you can apply or post."
        />
        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-md">
            <SignUpForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
