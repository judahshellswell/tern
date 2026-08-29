import type { Job } from "./types";

const NEGOTIABLE_PAY = "Negotiable — discussed at interview";
const NEGOTIABLE_HOURS = "Hours — discussed at interview";

export function formatPay(job: Pick<Job, "payMode" | "payMin" | "payMax">): string {
  const mode = job.payMode ?? "range";
  const currency = (n: number) =>
    n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

  if (mode === "negotiable") return NEGOTIABLE_PAY;
  if (mode === "fixed") return currency(job.payMin ?? 0);
  return `${currency(job.payMin ?? 0)}–${currency(job.payMax ?? 0)}`;
}

export function formatHours(
  job: Pick<Job, "hoursMode" | "hoursMin" | "hoursMax">,
): string | null {
  if (!job.hoursMode) return null;

  if (job.hoursMode === "negotiable") return NEGOTIABLE_HOURS;
  if (job.hoursMode === "fixed") return `${job.hoursMin ?? 0} hrs/week`;
  return `${job.hoursMin ?? 0}–${job.hoursMax ?? 0} hrs/week`;
}

export function formatCloseDate(closeDate: string | null | undefined): string | null {
  if (!closeDate) return null;
  return `Closes ${new Date(`${closeDate}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}
