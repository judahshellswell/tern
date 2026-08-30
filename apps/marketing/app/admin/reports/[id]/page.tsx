"use client";

import { use } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminGate } from "@/components/admin/admin-gate";
import { ReportDetail } from "@/components/admin/report-detail";

export default function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <AdminGate>
            <ReportDetail reportId={id} />
          </AdminGate>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
