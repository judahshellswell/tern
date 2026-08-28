import type { Job } from "./types";

export function formatPay(
  job: Pick<Job, "payMode" | "payType" | "payMin" | "payMax">,
): string {
  const mode = job.payMode ?? "range";
  const suffix = job.payType === "hourly" ? "/hr" : "";
  const currency = (n: number) =>
    n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

  if (mode === "negotiable") return "Negotiable";
  if (mode === "fixed") return `${currency(job.payMin ?? 0)}${suffix}`;
  return `${currency(job.payMin ?? 0)}–${currency(job.payMax ?? 0)}${suffix}`;
}

export function formatCloseDate(closeDate: string | null | undefined): string | null {
  if (!closeDate) return null;
  return `Closes ${new Date(`${closeDate}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}
