"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ref, getDownloadURL } from "firebase/storage";
import { getClientStorage } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth/auth-provider";
import {
  getReportDetailForAdmin,
  banUserAccount,
  suspendUserAccount,
  unsuspendUserAccount,
  dismissReport,
  markReportActioned,
  type ReportDetailForAdmin,
} from "@/app/actions";
import { ReasonForm } from "@/components/admin/reason-form";
import type { ReportStatus } from "@/lib/types";

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  dismissed: "Dismissed",
  actioned: "Actioned",
};

export function ReportDetail({ reportId }: { reportId: string }) {
  const { user } = useAuth();
  const [result, setResult] = useState<ReportDetailForAdmin | null | undefined>(undefined);
  const [action, setAction] = useState<"ban" | "suspend" | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReportDetailForAdmin(reportId).then((data) => {
      if (!cancelled) setResult(data);
    });
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (result === undefined) {
    return <p className="text-granite">Loading…</p>;
  }

  if (result === null) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">That report couldn&rsquo;t be found.</p>
      </div>
    );
  }

  const { report, reportedProfile, otherReports } = result;

  async function refresh() {
    const data = await getReportDetailForAdmin(reportId);
    setResult(data);
  }

  async function dismiss() {
    setIsPending(true);
    await dismissReport(reportId, user?.email ?? "");
    await refresh();
    setIsPending(false);
  }

  async function ban(reason: string) {
    setIsPending(true);
    await banUserAccount(report.reportedId, reason);
    await markReportActioned(reportId, user?.email ?? "");
    setAction(null);
    await refresh();
    setIsPending(false);
  }

  async function suspend(reason: string) {
    setIsPending(true);
    await suspendUserAccount(report.reportedId, reason);
    await markReportActioned(reportId, user?.email ?? "");
    setAction(null);
    await refresh();
    setIsPending(false);
  }

  async function unsuspend() {
    setIsPending(true);
    await unsuspendUserAccount(report.reportedId);
    await refresh();
    setIsPending(false);
  }

  return (
    <div>
      <Link
        href="/admin"
        className="text-xs font-mono uppercase tracking-[0.1em] text-granite-soft hover:text-tide"
      >
        &larr; Admin
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-[0.1em] text-tide">
        {reportedProfile.role === "job_seeker" ? "Job seeker" : "Employer"}
        {reportedProfile.verificationStatus === "suspended" && " · Suspended"}
        {reportedProfile.verificationStatus === "banned" && " · Banned"}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
        {reportedProfile.role === "job_seeker" ? reportedProfile.displayName : reportedProfile.businessName}
      </h1>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <DetailRow label="Email" value={reportedProfile.email} />
        <DetailRow label="Location" value={reportedProfile.location} />
        {reportedProfile.role === "job_seeker" ? (
          <>
            <DetailRow label="Date of birth" value={reportedProfile.dateOfBirth} />
            {reportedProfile.guardianEmail && (
              <DetailRow label="Guardian email" value={reportedProfile.guardianEmail} />
            )}
          </>
        ) : (
          <DetailRow label="Registration no." value={reportedProfile.registrationNumber} />
        )}
        <DetailRow label="Joined" value={reportedProfile.createdAt} />
        {reportedProfile.rejectionReason && (
          <DetailRow label="Reason on file" value={reportedProfile.rejectionReason} />
        )}
      </dl>

      <div className="mt-8 rounded-2xl border border-border-strong bg-paper-raised p-5">
        <p className="font-mono text-[10px] uppercase tracking-wide text-granite-soft">
          This report &middot; {REPORT_STATUS_LABELS[report.status]}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{report.reason}</p>

        {report.evidenceImagePaths && report.evidenceImagePaths.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {report.evidenceImagePaths.map((path) => (
              <EvidenceImage key={path} path={path} />
            ))}
          </div>
        )}

        {report.status === "open" && (
          <div className="mt-4">
            {action === "ban" && (
              <ReasonForm kind="ban" onCancel={() => setAction(null)} onConfirm={ban} />
            )}
            {action === "suspend" && (
              <ReasonForm kind="suspend" onCancel={() => setAction(null)} onConfirm={suspend} />
            )}
            {action === null && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={dismiss}
                  className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-tide cursor-pointer disabled:opacity-50"
                >
                  Dismiss
                </button>
                {reportedProfile.verificationStatus !== "suspended" && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setAction("suspend")}
                    className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-gorse hover:text-gorse cursor-pointer disabled:opacity-50"
                  >
                    Suspend
                  </button>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setAction("ban")}
                  className="ml-auto rounded-full bg-gorse px-4 py-2 text-sm font-semibold text-paper transition-colors hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  Ban reported user
                </button>
              </div>
            )}
          </div>
        )}

        {reportedProfile.verificationStatus === "suspended" && (
          <div className="mt-4">
            <button
              type="button"
              disabled={isPending}
              onClick={unsuspend}
              className="rounded-full bg-tide px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright cursor-pointer disabled:opacity-50"
            >
              Lift suspension
            </button>
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.1em] text-granite-soft">
          Other reports against this account ({otherReports.length})
        </p>
        {otherReports.length === 0 ? (
          <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 text-center">
            <p className="text-sm text-granite">No other reports.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {otherReports.map((other) => (
              <div key={other.id} className="rounded-2xl border border-border-strong bg-paper-raised p-4">
                <p className="font-mono text-[10px] uppercase tracking-wide text-granite-soft">
                  {REPORT_STATUS_LABELS[other.status]}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{other.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EvidenceImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDownloadURL(ref(getClientStorage(), path))
      .then((downloadUrl) => {
        if (!cancelled) setUrl(downloadUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (failed) {
    return <p className="text-xs text-gorse">Couldn&rsquo;t load an image.</p>;
  }

  if (!url) {
    return <p className="text-xs text-granite-soft">Loading…</p>;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Image
        src={url}
        alt="Report evidence"
        width={160}
        height={160}
        unoptimized
        className="rounded-lg border border-border-strong object-cover"
      />
    </a>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-granite-soft">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
