"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { getClientFirestore, getClientStorage } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth/auth-provider";
import { JOB_TYPE_LABELS, type HoursMode, type Job, type JobType, type Parish, type PayMode } from "@/lib/types";
import { ParishSelect } from "@/components/ui/parish-select";

const JOB_TYPES = Object.keys(JOB_TYPE_LABELS) as JobType[];

const MODE_LABELS: Record<PayMode | HoursMode, string> = {
  range: "Range",
  fixed: "Fixed",
  negotiable: "Negotiable",
};

export function PostJobForm({ initialJob }: { initialJob?: Job }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [type, setType] = useState<JobType>(initialJob?.type ?? "part_time");
  const [title, setTitle] = useState(initialJob?.title ?? "");
  const [description, setDescription] = useState(initialJob?.description ?? "");
  const [location, setLocation] = useState<Parish | "">(initialJob?.location ?? "");
  const [payMode, setPayMode] = useState<PayMode>(initialJob?.payMode ?? "range");
  const [payMin, setPayMin] = useState(initialJob?.payMin != null ? String(initialJob.payMin) : "");
  const [payMax, setPayMax] = useState(initialJob?.payMax != null ? String(initialJob.payMax) : "");
  const [hoursMode, setHoursMode] = useState<HoursMode>(initialJob?.hoursMode ?? "range");
  const [hoursMin, setHoursMin] = useState(initialJob?.hoursMin != null ? String(initialJob.hoursMin) : "");
  const [hoursMax, setHoursMax] = useState(initialJob?.hoursMax != null ? String(initialJob.hoursMax) : "");
  const [closeDate, setCloseDate] = useState(initialJob?.closeDate ?? "");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(initialJob?.skills ?? []);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  if (loading) {
    return <p className="text-granite">Loading…</p>;
  }

  if (!user || !profile) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">You need to be logged in to post a job.</p>
        <Link href="/log-in" className="mt-3 inline-block font-medium text-tide underline">
          Log in
        </Link>
      </div>
    );
  }

  if (profile.role !== "employer") {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">Only employer accounts can post jobs.</p>
      </div>
    );
  }

  if (profile.verificationStatus === "suspended") {
    return (
      <div className="rounded-2xl border border-border-strong bg-gorse-bg p-6">
        <p className="font-semibold text-gorse">Account under review</p>
        <p className="mt-1 text-sm text-granite">
          Your account is temporarily suspended, so you can&rsquo;t post a job right now.
        </p>
        <Link href="/dashboard" className="mt-3 inline-block font-medium text-tide underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (profile.verificationStatus !== "approved") {
    return (
      <div className="rounded-2xl border border-border-strong bg-gorse-bg p-6">
        <p className="font-semibold text-gorse">Verification pending</p>
        <p className="mt-1 text-sm text-granite">
          You&rsquo;ll be able to post a job once your business is verified.
        </p>
        <Link href="/dashboard" className="mt-3 inline-block font-medium text-tide underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  function addSkill() {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!location) {
      setError("Please select a parish.");
      return;
    }

    let min: number | null = null;
    let max: number | null = null;
    if (payMode === "range") {
      min = Number(payMin);
      max = Number(payMax);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
        setError("Enter a valid pay range.");
        return;
      }
    } else if (payMode === "fixed") {
      min = Number(payMin);
      if (!Number.isFinite(min) || min <= 0) {
        setError("Enter a valid pay amount.");
        return;
      }
    }

    let hMin: number | null = null;
    let hMax: number | null = null;
    if (hoursMode === "range") {
      hMin = Number(hoursMin);
      hMax = Number(hoursMax);
      if (!Number.isFinite(hMin) || !Number.isFinite(hMax) || hMin <= 0 || hMax < hMin) {
        setError("Enter a valid hours range.");
        return;
      }
    } else if (hoursMode === "fixed") {
      hMin = Number(hoursMin);
      if (!Number.isFinite(hMin) || hMin <= 0) {
        setError("Enter a valid number of hours.");
        return;
      }
    }

    setIsPending(true);
    try {
      const content = {
        title,
        description,
        type,
        location,
        payMode,
        payMin: min,
        payMax: max,
        hoursMode,
        hoursMin: hMin,
        hoursMax: hMax,
        closeDate: closeDate || null,
        skills,
      };

      if (initialJob) {
        await updateDoc(doc(getClientFirestore(), "jobs", initialJob.id), content);
        router.push(`/employer/jobs/${initialJob.id}`);
      } else {
        const logoPath = (profile as { logoPath: string }).logoPath;
        const employerLogoUrl = logoPath
          ? await getDownloadURL(ref(getClientStorage(), logoPath))
          : null;
        await addDoc(collection(getClientFirestore(), "jobs"), {
          ...content,
          employerId: user!.uid,
          employerName: (profile as { businessName: string }).businessName,
          employerLogoUrl,
          status: "published",
          viewCount: 0,
          createdAt: serverTimestamp(),
        });
        router.push("/jobs");
      }
    } catch {
      setError(
        initialJob ? "Couldn't save your changes. Please try again." : "Couldn't post the job. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-strong bg-paper-raised p-6 sm:p-8 shadow-[0_1px_2px_rgba(18,33,30,0.06),0_8px_24px_rgba(18,33,30,0.05)]"
    >
      <div className="flex flex-col gap-5">
        <div>
          <label className="mb-2 block text-xs font-medium text-granite">Job type</label>
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  type === t
                    ? "border-tide bg-tide text-paper"
                    : "border-border-strong text-ink hover:border-tide"
                }`}
              >
                {JOB_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <TextField label="Job title" value={title} onChange={setTitle} placeholder="Weekend retail assistant" />

        <div>
          <label htmlFor="job-description" className="mb-1.5 block text-xs font-medium text-granite">
            Description
          </label>
          <textarea
            id="job-description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will they actually be doing?"
            className="w-full rounded-2xl border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
          />
        </div>

        <ParishSelect id="job-location" label="Location" value={location} onChange={setLocation} />

        <div>
          <label className="mb-2 block text-xs font-medium text-granite">Hours per week</label>
          <div className="flex flex-wrap gap-2">
            {(["range", "fixed", "negotiable"] as HoursMode[]).map((hm) => (
              <button
                key={hm}
                type="button"
                onClick={() => setHoursMode(hm)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  hoursMode === hm
                    ? "border-tide bg-tide text-paper"
                    : "border-border-strong text-ink hover:border-tide"
                }`}
              >
                {MODE_LABELS[hm]}
              </button>
            ))}
          </div>

          {hoursMode === "range" && (
            <div className="mt-3 flex gap-3">
              <input
                type="number"
                min="0"
                step="1"
                required
                placeholder="Min hrs"
                value={hoursMin}
                onChange={(e) => setHoursMin(e.target.value)}
                className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
              />
              <input
                type="number"
                min="0"
                step="1"
                required
                placeholder="Max hrs"
                value={hoursMax}
                onChange={(e) => setHoursMax(e.target.value)}
                className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
              />
            </div>
          )}

          {hoursMode === "fixed" && (
            <div className="mt-3">
              <input
                type="number"
                min="0"
                step="1"
                required
                placeholder="Hours per week"
                value={hoursMin}
                onChange={(e) => setHoursMin(e.target.value)}
                className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
              />
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-granite">Pay</label>
          <div className="flex flex-wrap gap-2">
            {(["range", "fixed", "negotiable"] as PayMode[]).map((pm) => (
              <button
                key={pm}
                type="button"
                onClick={() => setPayMode(pm)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  payMode === pm
                    ? "border-tide bg-tide text-paper"
                    : "border-border-strong text-ink hover:border-tide"
                }`}
              >
                {MODE_LABELS[pm]}
              </button>
            ))}
          </div>

          {payMode === "range" && (
            <div className="mt-3 flex gap-3">
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="Min £"
                value={payMin}
                onChange={(e) => setPayMin(e.target.value)}
                className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="Max £"
                value={payMax}
                onChange={(e) => setPayMax(e.target.value)}
                className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
              />
            </div>
          )}

          {payMode === "fixed" && (
            <div className="mt-3">
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="Pay £"
                value={payMin}
                onChange={(e) => setPayMin(e.target.value)}
                className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="job-skills" className="mb-1.5 block text-xs font-medium text-granite">
            Skills &amp; qualities
          </label>
          <div className="flex gap-2">
            <input
              id="job-skills"
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Customer service"
              className="flex-1 rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
            />
            <button
              type="button"
              onClick={addSkill}
              className="rounded-full border border-border-strong px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-tide cursor-pointer"
            >
              Add
            </button>
          </div>
          {skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="flex items-center gap-1.5 rounded-full bg-tide px-3 py-1.5 text-xs font-medium text-paper cursor-pointer"
                >
                  {skill}
                  <span aria-hidden="true">&times;</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="job-close-date" className="mb-1.5 block text-xs font-medium text-granite">
            Closing date (optional)
          </label>
          <input
            id="job-close-date"
            type="date"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
            className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink outline-none transition-colors focus:border-tide"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !location}
          className="rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer"
        >
          {isPending
            ? initialJob
              ? "Saving…"
              : "Publishing…"
            : initialJob
              ? "Save changes"
              : "Publish job"}
        </button>

        {error && (
          <p role="alert" className="text-sm text-gorse">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const id = `job-field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-granite">
        {label}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
      />
    </div>
  );
}
