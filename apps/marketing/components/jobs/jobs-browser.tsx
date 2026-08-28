"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { JOB_TYPE_LABELS, type Job, type JobType } from "@/lib/types";
import { formatCloseDate, formatPay } from "@/lib/format";

const ALL = "all" as const;

export function JobsBrowser() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [typeFilter, setTypeFilter] = useState<JobType | typeof ALL>(ALL);

  useEffect(() => {
    const q = query(
      collection(getClientFirestore(), "jobs"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Job));
    });
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    if (!jobs) return null;
    if (typeFilter === ALL) return jobs;
    return jobs.filter((job) => job.type === typeFilter);
  }, [jobs, typeFilter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <FilterChip label="All types" active={typeFilter === ALL} onClick={() => setTypeFilter(ALL)} />
        {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((type) => (
          <FilterChip
            key={type}
            label={JOB_TYPE_LABELS[type]}
            active={typeFilter === type}
            onClick={() => setTypeFilter(type)}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {filtered === null && <p className="text-granite">Loading jobs…</p>}

        {filtered !== null && filtered.length === 0 && (
          <div className="rounded-2xl border border-border-strong bg-paper-raised p-8 text-center">
            <p className="font-serif text-lg font-semibold">No jobs match yet</p>
            <p className="mt-1 text-sm text-granite">
              Check back soon, or try a different job type.
            </p>
          </div>
        )}

        {filtered?.map((job) => <JobCard key={job.id} job={job} />)}
      </div>
    </div>
  );
}

export function EmployerLogo({
  url,
  name,
  size = 40,
}: {
  url: string | null | undefined;
  name: string;
  size?: number;
}) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full border border-border-strong object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-paper font-serif font-semibold text-granite"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
        active
          ? "border-tide bg-tide text-paper"
          : "border-border-strong text-ink hover:border-tide"
      }`}
    >
      {label}
    </button>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="rounded-2xl border border-border-strong bg-paper-raised p-6 transition-colors hover:border-tide"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <EmployerLogo url={job.employerLogoUrl} name={job.employerName} />
          <div>
            <p className="font-serif text-lg font-semibold">{job.title}</p>
            <p className="mt-0.5 text-sm text-granite">{job.employerName}</p>
          </div>
        </div>
        <span className="rounded-full bg-tide/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-tide">
          {JOB_TYPE_LABELS[job.type]}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-granite-soft">
        <span>{job.location}</span>
        {job.hoursPerWeek && <span>{job.hoursPerWeek} hrs/week</span>}
        <span className="tabular-nums">{formatPay(job)}</span>
        {formatCloseDate(job.closeDate) && <span>{formatCloseDate(job.closeDate)}</span>}
      </div>

      {job.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border-strong px-2.5 py-1 text-xs font-medium text-granite"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
