"use client";

import { useState } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth/auth-provider";

export function ApplyPanel({
  jobId,
  jobTitle,
  employerId,
}: {
  jobId: string;
  jobTitle: string;
  employerId: string;
}) {
  const { user, profile, loading } = useAuth();
  const [coverNote, setCoverNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  if (loading) {
    return <p className="text-granite">Loading…</p>;
  }

  if (!user || !profile) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">Log in as a job seeker to apply.</p>
        <Link href="/log-in" className="mt-3 inline-block font-medium text-tide underline">
          Log in
        </Link>
      </div>
    );
  }

  if (profile.role !== "job_seeker") {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">Only job seeker accounts can apply.</p>
      </div>
    );
  }

  if (profile.verificationStatus !== "approved") {
    return (
      <div className="rounded-2xl border border-border-strong bg-gorse-bg p-6">
        <p className="font-semibold text-gorse">Verification pending</p>
        <p className="mt-1 text-sm text-granite">
          You&rsquo;ll be able to apply once you&rsquo;re verified.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 text-center animate-rise">
        <p className="font-serif text-lg font-semibold text-tide">Application submitted.</p>
        <p className="mt-1 text-sm text-granite">
          {profile.displayName === undefined ? "" : `Good luck, ${profile.displayName.split(" ")[0]}. `}
          The employer will be in touch through Tern.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsPending(true);
    try {
      await addDoc(collection(getClientFirestore(), "applications"), {
        jobId,
        jobTitle,
        employerId,
        applicantId: user!.uid,
        applicantName: (profile as { displayName: string }).displayName,
        coverNote,
        status: "submitted",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch {
      setError("Couldn't submit your application. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-strong bg-paper-raised p-6 sm:p-8 shadow-[0_1px_2px_rgba(18,33,30,0.06),0_8px_24px_rgba(18,33,30,0.05)]"
    >
      <label htmlFor="cover-note" className="mb-1.5 block text-xs font-medium text-granite">
        Cover note (optional)
      </label>
      <textarea
        id="cover-note"
        rows={4}
        value={coverNote}
        onChange={(e) => setCoverNote(e.target.value)}
        placeholder="Anything you'd like to add?"
        className="w-full rounded-2xl border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
      />
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer"
      >
        {isPending ? "Submitting…" : "Submit application"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-gorse">
          {error}
        </p>
      )}
    </form>
  );
}
