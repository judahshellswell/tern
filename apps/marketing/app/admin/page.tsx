import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminVerificationQueue } from "@/components/admin/verification-queue";
import { AllUsersQueue } from "@/components/admin/all-users-queue";
import { ReportsQueue } from "@/components/admin/reports-queue";

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
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">Admin</h1>
          <AdminGate>
            <section>
              <h2 className="mt-10 font-serif text-xl font-semibold">Verification queue</h2>
              <div className="mt-4">
                <AdminVerificationQueue />
              </div>
            </section>

            <section>
              <h2 className="mt-12 font-serif text-xl font-semibold">All users</h2>
              <div className="mt-4">
                <AllUsersQueue />
              </div>
            </section>

            <section>
              <h2 className="mt-12 font-serif text-xl font-semibold">Reports</h2>
              <div className="mt-4">
                <ReportsQueue />
              </div>
            </section>
          </AdminGate>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
