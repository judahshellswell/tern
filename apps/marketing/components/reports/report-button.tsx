"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { createReport } from "@/lib/reports";
import { ReasonForm } from "@/components/admin/reason-form";
import type { UserRole } from "@/lib/types";

export function ReportButton({
  reporterRole,
  reportedId,
  reportedRole,
  reportedName,
}: {
  reporterRole: UserRole;
  reportedId: string;
  reportedRole: UserRole;
  reportedName: string;
}) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user || !profile || profile.role !== reporterRole || user.uid === reportedId) {
    return null;
  }

  if (submitted) {
    return <p className="text-sm text-granite-soft">Report submitted — thanks for letting us know.</p>;
  }

  async function submit(reason: string) {
    await createReport({
      reporterId: user!.uid,
      reporterRole,
      reportedId,
      reportedRole,
      reportedName,
      reason,
    });
    setSubmitted(true);
    setOpen(false);
  }

  if (open) {
    return <ReasonForm kind="report" onCancel={() => setOpen(false)} onConfirm={submit} />;
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="text-sm font-medium text-granite-soft underline hover:text-gorse cursor-pointer"
    >
      Report {reportedRole === "employer" ? "employer" : "job seeker"}
    </button>
  );
}
