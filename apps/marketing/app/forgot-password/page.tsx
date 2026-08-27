import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password — Tern",
  description: "Get a link to reset your Tern account password.",
};

export default function ForgotPasswordPage() {
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
