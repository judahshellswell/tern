import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JOB_TYPE_LABELS, type HoursMode, type PayMode } from "@/lib/types";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { ApplyPanel } from "@/components/jobs/apply-panel";
import { EmployerLogo } from "@/components/jobs/jobs-browser";
import { formatCloseDate, formatHours, formatPay } from "@/lib/format";

type Params = { id: string };

async function getJob(id: string) {
  const snap = await getAdminFirestore().collection("jobs").doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (data.status !== "published") return null;
  return {
    id: snap.id,
    employerId: data.employerId as string,
    employerName: data.employerName as string,
    employerLogoUrl: (data.employerLogoUrl as string | null) ?? null,
    title: data.title as string,
    description: data.description as string,
    type: data.type as keyof typeof JOB_TYPE_LABELS,
    location: data.location as string,
    payMode: data.payMode as PayMode | undefined,
    payMin: (data.payMin as number | null | undefined) ?? null,
    payMax: (data.payMax as number | null | undefined) ?? null,
    hoursMode: data.hoursMode as HoursMode | undefined,
    hoursMin: (data.hoursMin as number | null | undefined) ?? null,
    hoursMax: (data.hoursMax as number | null | undefined) ?? null,
    closeDate: (data.closeDate as string | null | undefined) ?? null,
    skills: (data.skills as string[]) ?? [],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "Job not found — Tern" };
  return {
    title: `${job.title} at ${job.employerName} — Tern`,
    description: job.description.slice(0, 155),
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <span className="rounded-full bg-tide/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-tide">
            {JOB_TYPE_LABELS[job.type]}
          </span>
          <h1 className="mt-4 text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {job.title}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <EmployerLogo url={job.employerLogoUrl} name={job.employerName} size={48} />
            <p className="text-lg text-granite">{job.employerName}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-y border-border py-4 font-mono text-sm text-ink">
            <span>{job.location}</span>
            {formatHours(job) && <span>{formatHours(job)}</span>}
            <span className="tabular-nums">{formatPay(job)}</span>
            {formatCloseDate(job.closeDate) && <span>{formatCloseDate(job.closeDate)}</span>}
          </div>

          <p className="mt-8 max-w-[70ch] whitespace-pre-wrap text-[17px] leading-relaxed text-ink">
            {job.description}
          </p>

          {job.skills.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-border-strong px-3 py-1.5 text-sm font-medium text-granite"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="mt-10">
            <ApplyPanel
              jobId={job.id}
              jobTitle={job.title}
              employerId={job.employerId}
              employerName={job.employerName}
              employerLogoUrl={job.employerLogoUrl}
              jobType={job.type}
              location={job.location}
              description={job.description}
              payMode={job.payMode}
              payMin={job.payMin}
              payMax={job.payMax}
              hoursMode={job.hoursMode}
              hoursMin={job.hoursMin}
              hoursMax={job.hoursMax}
              skills={job.skills}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
