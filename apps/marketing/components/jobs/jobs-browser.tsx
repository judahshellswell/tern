"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { JOB_TYPE_LABELS, PARISHES, type Job, type JobType, type Parish } from "@/lib/types";
import { formatCloseDate, formatHours, formatPay } from "@/lib/format";
import { useAuth } from "@/components/auth/auth-provider";

const ALL = "all" as const;

export function JobsBrowser() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [typeFilter, setTypeFilter] = useState<JobType | typeof ALL>(ALL);
  const [parishFilter, setParishFilter] = useState<Parish[]>([]);

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

  function toggleParish(parish: Parish) {
    setParishFilter((prev) =>
      prev.includes(parish) ? prev.filter((p) => p !== parish) : [...prev, parish],
    );
  }

  const filtered = useMemo(() => {
    if (!jobs) return null;
    return jobs.filter(
      (job) =>
        (typeFilter === ALL || job.type === typeFilter) &&
        (parishFilter.length === 0 || parishFilter.includes(job.location)),
    );
  }, [jobs, typeFilter, parishFilter]);

  // For a logged-in job seeker, boost jobs matching their preferred job
  // types or home parish toward the top — a relevance signal, not a hard
  // filter. Everyone else (logged out, or an employer) sees the plain
  // createdAt-desc order the query already produced. Array.prototype.sort
  // is spec-guaranteed stable, so within each relevance tier the existing
  // createdAt-desc order is preserved "for free".
  const ordered = useMemo(() => {
    if (!filtered) return null;
    if (!profile || profile.role !== "job_seeker") return filtered;
    const preferredTypes = new Set(profile.preferredJobTypes ?? []);
    const homeParish = profile.location;
    function tier(job: Job): number {
      const typeMatch = preferredTypes.has(job.type);
      const parishMatch = job.location === homeParish;
      if (typeMatch && parishMatch) return 0;
      if (typeMatch || parishMatch) return 1;
      return 2;
    }
    return [...filtered].sort((a, b) => tier(a) - tier(b));
  }, [filtered, profile]);

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

      <div className="mt-3 flex flex-wrap gap-2">
        {PARISHES.map((parish) => (
          <FilterChip
            key={parish}
            label={parish}
            active={parishFilter.includes(parish)}
            onClick={() => toggleParish(parish)}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {ordered === null && <p className="text-granite">Loading jobs…</p>}

        {ordered !== null && ordered.length === 0 && (
          <div className="rounded-2xl border border-border-strong bg-paper-raised p-8 text-center">
            <p className="font-serif text-lg font-semibold">No jobs match yet</p>
            <p className="mt-1 text-sm text-granite">
              Check back soon, or try a different job type or parish.
            </p>
          </div>
        )}

        {ordered?.map((job) => <JobCard key={job.id} job={job} />)}
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
        {formatHours(job) && <span>{formatHours(job)}</span>}
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
