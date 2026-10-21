import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LAUNCH_GATE_ACTIVE } from "@/lib/launch-gate";

export const metadata: Metadata = {
  title: "Reset your password — Tern",
  description: "Get a link to reset your Tern account password.",
};

export default function ForgotPasswordPage() {
  // --- TEMPORARY pre-launch gate, remove this block on launch day ---
  if (LAUNCH_GATE_ACTIVE) redirect("/coming-soon");
  // --- end temporary block ---

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Account"
          title="Reset your password."
          lede="Enter your account email and we'll send you a link to set a new password."
        />
        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-md">
            <ForgotPasswordForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
