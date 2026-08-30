"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { submitReadinessGate } from "@/app/actions";
import { READINESS_GATE_QUESTIONS, type ReadinessGateSubmission } from "@/lib/types";

export default function ReadinessGatePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">Job seeker</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">Readiness check.</h1>
          <p className="mt-2 text-granite">
            A few quick questions before you start applying — we just want to know
            you&rsquo;re ready to show up and do good work.
          </p>
          <div className="mt-8">
            <ReadinessGate />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function ReadinessGate() {
  const { user, profile, loading } = useAuth();
  const [submission, setSubmission] = useState<ReadinessGateSubmission | null | undefined>(undefined);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [showForm, setShowForm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const ref = doc(getClientFirestore(), "users", user.uid, "readinessGate", "submission");
    const unsubscribe = onSnapshot(ref, (snap) => {
      setSubmission(snap.exists() ? (snap.data() as ReadinessGateSubmission) : null);
    });
    return unsubscribe;
  }, [user]);

  if (loading || submission === undefined) {
    return <p className="text-granite">Loading…</p>;
  }

  if (!user || !profile) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">You need to be logged in to see this page.</p>
        <Link href="/log-in" className="mt-3 inline-block font-medium text-tide underline">
          Log in
        </Link>
      </div>
    );
  }

  if (profile.role !== "job_seeker") {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">Only job seeker accounts need a readiness check.</p>
      </div>
    );
  }

  if (profile.verificationStatus !== "approved") {
    return (
      <div className="rounded-2xl border border-border-strong bg-gorse-bg p-6">
        <p className="font-semibold text-gorse">Verification pending</p>
        <p className="mt-1 text-sm text-granite">
          You&rsquo;ll be able to do your readiness check once you&rsquo;re verified.
        </p>
      </div>
    );
  }

  if (submission?.outcome === "passed") {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 text-center">
        <p className="font-serif text-lg font-semibold text-tide">You&rsquo;re all set.</p>
        <p className="mt-1 text-sm text-granite">You can apply to jobs now.</p>
        <Link
          href="/jobs"
          className="mt-4 inline-block rounded-full bg-tide px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright"
        >
          Browse jobs
        </Link>
      </div>
    );
  }

  if (submission?.outcome === "flagged") {
    return (
      <div className="rounded-2xl border border-border-strong bg-gorse-bg p-6">
        <p className="font-semibold text-gorse">Your answers are being reviewed</p>
        <p className="mt-1 text-sm text-granite">
          We&rsquo;re taking a closer look before you can start applying — we&rsquo;ll let you know
          once it&rsquo;s done.
        </p>
      </div>
    );
  }

  const rejected = submission?.outcome === "rejected";

  if (rejected && !showForm) {
    return (
      <div className="rounded-2xl border border-border-strong bg-gorse-bg p-6">
        <p className="font-semibold text-gorse">Your answers weren&rsquo;t approved</p>
        {submission.adminReason && (
          <p className="mt-3 rounded-xl border border-border-strong bg-paper px-4 py-3 text-sm text-ink">
            &ldquo;{submission.adminReason}&rdquo;
          </p>
        )}
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 rounded-full bg-tide px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answers.some((a) => a.trim().length < 10)) {
      setError("Please give a full answer to each question.");
      return;
    }
    setError("");
    setIsPending(true);
    try {
      const result = await submitReadinessGate(user!.uid, answers as [string, string, string]);
      if (!result.ok) {
        setError(result.error);
      } else {
        setShowForm(false);
      }
    } catch {
      setError("Couldn't submit your answers. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-2xl border border-border-strong bg-paper-raised p-6 sm:p-8"
    >
      {READINESS_GATE_QUESTIONS.map((question, i) => (
        <div key={question}>
          <label htmlFor={`answer-${i}`} className="mb-1.5 block text-sm font-medium text-ink">
            {question}
          </label>
          <textarea
            id={`answer-${i}`}
            rows={3}
            value={answers[i]}
            onChange={(e) => {
              const next = [...answers];
              next[i] = e.target.value;
              setAnswers(next);
            }}
            className="w-full rounded-2xl border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink outline-none transition-colors focus:border-tide"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer"
      >
        {isPending ? "Submitting…" : "Submit"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-gorse">
          {error}
        </p>
      )}
    </form>
  );
}
