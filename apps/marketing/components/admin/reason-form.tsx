"use client";

import { useState } from "react";

export type ReasonFormKind = "reject" | "ban" | "report" | "suspend";

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
};

export function ReasonForm({
  kind,
  onCancel,
  onConfirm,
}: {
  kind: ReasonFormKind;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
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
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!reason.trim() || isSubmitting}
          onClick={async () => {
            setIsSubmitting(true);
            await onConfirm(reason.trim());
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
