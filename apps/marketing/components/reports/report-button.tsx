"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { reserveReportId, createReport } from "@/app/actions";
import { validateReportEvidence, uploadReportEvidence } from "@/lib/report-evidence-upload";
import { ReasonForm } from "@/components/admin/reason-form";
import type { UserRole } from "@/lib/types";

const MAX_EVIDENCE_FILES = 3;

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
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");

  if (!user || !profile || profile.role !== reporterRole || user.uid === reportedId) {
    return null;
  }

  if (submitted) {
    return <p className="text-sm text-granite-soft">Report submitted — thanks for letting us know.</p>;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, MAX_EVIDENCE_FILES);
    for (const file of selected) {
      const validationError = validateReportEvidence(file);
      if (validationError) {
        setFileError(validationError);
        setFiles([]);
        return;
      }
    }
    setFileError("");
    setFiles(selected);
  }

  async function submit(reason: string) {
    setSubmitError("");
    try {
      const reportId = await reserveReportId();
      const evidenceImagePaths =
        files.length > 0 ? await uploadReportEvidence(user!.uid, reportId, files) : undefined;
      const result = await createReport({
        reportId,
        reporterId: user!.uid,
        reporterRole,
        reportedId,
        reportedRole,
        reportedName,
        reason,
        evidenceImagePaths,
      });
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setSubmitted(true);
      setOpen(false);
    } catch {
      setSubmitError("Couldn't submit your report. Please try again.");
    }
  }

  if (open) {
    return (
      <div>
        <div className="mb-3">
          <label htmlFor="report-evidence" className="mb-1.5 block text-xs font-medium text-granite">
            Evidence (optional, up to {MAX_EVIDENCE_FILES} images)
          </label>
          <input
            id="report-evidence"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border file:border-border-strong file:bg-paper file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:border-tide file:cursor-pointer"
          />
          {fileError && (
            <p role="alert" className="mt-1.5 text-xs text-gorse">
              {fileError}
            </p>
          )}
          {files.length > 0 && !fileError && (
            <p className="mt-1.5 text-xs text-granite-soft">
              {files.length} image{files.length > 1 ? "s" : ""} selected.
            </p>
          )}
        </div>
        <ReasonForm kind="report" onCancel={() => setOpen(false)} onConfirm={submit} />
        {submitError && (
          <p role="alert" className="mt-2 text-sm text-gorse">
            {submitError}
          </p>
        )}
      </div>
    );
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
