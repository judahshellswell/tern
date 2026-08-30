"use client";

import { useState } from "react";
import { READINESS_RETAKE_DELAY_LABELS, type ReadinessRetakeDelay } from "@/lib/types";

const READINESS_RETAKE_DELAY_OPTIONS = Object.keys(READINESS_RETAKE_DELAY_LABELS) as ReadinessRetakeDelay[];

export type ReasonFormKind = "reject" | "ban" | "report" | "suspend" | "readiness_reject";

export const REASON_FORM_COPY: Record<
  ReasonFormKind,
  { label: string; placeholder: string; confirmLabel: string; submittingLabel: string }
> = {
  reject: {
    label:
      "Why are you rejecting this? They'll see this message and it'll be emailed to them. They can update their details and resubmit.",
    placeholder:
      "e.g. The ID you uploaded doesn't match the name on your profile — please resubmit with a clear photo.",
    confirmLabel: "Confirm rejection",
    submittingLabel: "Rejecting…",
  },
  ban: {
    label:
      "Why are you banning this account? They'll see this message and it'll be emailed to them. Banned accounts can never resubmit.",
    placeholder: "e.g. The uploaded ID appears to be fabricated.",
    confirmLabel: "Confirm ban",
    submittingLabel: "Banning…",
  },
  report: {
    label: "Why are you reporting this account? An admin will review it.",
    placeholder: "e.g. They asked me to pay a fee to secure the job.",
    confirmLabel: "Submit report",
    submittingLabel: "Submitting…",
  },
  suspend: {
    label:
      "Why are you suspending this account? They'll see this message and it'll be emailed to them. This is reversible — you can lift the suspension later.",
    placeholder: "e.g. Under review after multiple reports — investigating before deciding next steps.",
    confirmLabel: "Confirm suspension",
    submittingLabel: "Suspending…",
  },
  readiness_reject: {
    label:
      "Why are you rejecting these answers? They'll see this message and can resubmit right away.",
    placeholder:
      "e.g. These answers don't really engage with the questions — give them another shot with more specific detail.",
    confirmLabel: "Confirm rejection",
    submittingLabel: "Rejecting…",
  },
};

export function ReasonForm({
  kind,
  onCancel,
  onConfirm,
}: {
  kind: ReasonFormKind;
  onCancel: () => void;
  onConfirm: (reason: string, retakeDelay?: ReadinessRetakeDelay) => void;
}) {
  const [reason, setReason] = useState("");
  const [retakeDelay, setRetakeDelay] = useState<ReadinessRetakeDelay>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = REASON_FORM_COPY[kind];

  return (
    <div className="mt-4 rounded-xl border border-border-strong bg-paper p-4">
      <label htmlFor="reason-input" className="mb-1.5 block text-xs font-medium text-granite">
        {copy.label}
      </label>
      <textarea
        id="reason-input"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder={copy.placeholder}
        className="w-full rounded-lg border border-border-strong bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
      />
      {kind === "readiness_reject" && (
        <div className="mt-3">
          <label htmlFor="retake-delay-select" className="mb-1.5 block text-xs font-medium text-granite">
            How long before they can retake the course?
          </label>
          <select
            id="retake-delay-select"
            value={retakeDelay}
            onChange={(e) => setRetakeDelay(e.target.value as ReadinessRetakeDelay)}
            className="w-full rounded-lg border border-border-strong bg-paper-raised px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-tide"
          >
            {READINESS_RETAKE_DELAY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {READINESS_RETAKE_DELAY_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!reason.trim() || isSubmitting}
          onClick={async () => {
            setIsSubmitting(true);
            await onConfirm(reason.trim(), kind === "readiness_reject" ? retakeDelay : undefined);
          }}
          className="rounded-full bg-gorse px-4 py-2 text-sm font-semibold text-paper transition-colors hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? copy.submittingLabel : copy.confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-tide cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
