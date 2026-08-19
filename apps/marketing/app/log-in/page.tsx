import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { LogInForm } from "@/components/auth/log-in-form";

export const metadata: Metadata = {
  title: "Log in — Tern",
  description: "Log in to your Tern account.",
};

export default function LogInPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHeader eyebrow="Welcome back" title="Log in." />
        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-md">
            <LogInForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
