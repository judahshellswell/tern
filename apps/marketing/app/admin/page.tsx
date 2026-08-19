import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminVerificationQueue } from "@/components/admin/verification-queue";

export const metadata: Metadata = {
  title: "Admin — Tern",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">Admin</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
            Verification queue
          </h1>
          <div className="mt-8">
            <AdminVerificationQueue />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
