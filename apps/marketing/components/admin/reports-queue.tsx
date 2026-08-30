"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth/auth-provider";
import { banUserAccount, dismissReport, markReportActioned } from "@/app/actions";
import { ReasonForm } from "@/components/admin/reason-form";
import type { Report } from "@/lib/types";

export function ReportsQueue() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [banningId, setBanningId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(getClientFirestore(), "reports"), where("status", "==", "open"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Report));
    });
    return unsubscribe;
  }, []);

  async function dismiss(report: Report) {
    await dismissReport(report.id, user?.email ?? "");
  }

  async function banReported(report: Report, reason: string) {
    await banUserAccount(report.reportedId, reason);
    await markReportActioned(report.id, user?.email ?? "");
    setBanningId(null);
  }

  if (reports === null) {
    return <p className="text-granite">Loading reports…</p>;
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 text-center">
        <p className="text-granite">No open reports.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {reports.map((report) => (
        <div key={report.id} className="rounded-2xl border border-border-strong bg-paper-raised p-5">
          <Link href={`/admin/reports/${report.id}`} className="block hover:opacity-80">
            <p className="font-serif text-lg font-semibold">{report.reportedName}</p>
            <p className="text-xs text-granite-soft">
              Reported {report.reportedRole === "employer" ? "employer" : "job seeker"}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{report.reason}</p>
          </Link>

          {banningId === report.id ? (
            <ReasonForm
              kind="ban"
              onCancel={() => setBanningId(null)}
              onConfirm={(reason) => banReported(report, reason)}
            />
          ) : (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => dismiss(report)}
                className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-tide cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => setBanningId(report.id)}
                className="ml-auto rounded-full bg-gorse px-4 py-2 text-sm font-semibold text-paper transition-colors hover:opacity-90 cursor-pointer"
              >
                Ban reported user
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
