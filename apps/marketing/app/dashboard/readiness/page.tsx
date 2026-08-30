"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { submitReadinessGate } from "@/app/actions";
import { READINESS_COURSE, type ReadinessGateSubmission } from "@/lib/types";
import type { ReadinessRawAnswers } from "@/lib/readiness-gate";

export default function ReadinessGatePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">Job seeker</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">Readiness check.</h1>
          <p className="mt-2 text-granite">
            A short course before you start applying — about 30 minutes, a mix of scenarios and
            questions. We want to know you&rsquo;re genuinely ready to show up and do good work.
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

const STORAGE_KEY_PREFIX = "tern-readiness-answers-";

function loadStoredAnswers(uid: string): ReadinessRawAnswers {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + uid);
    return raw ? (JSON.parse(raw) as ReadinessRawAnswers) : {};
  } catch {
    return {};
  }
}

function storeAnswers(uid: string, answers: ReadinessRawAnswers) {
  try {
    window.localStorage.setItem(STORAGE_KEY_PREFIX + uid, JSON.stringify(answers));
  } catch {
    // best-effort only — losing in-progress persistence isn't fatal
  }
}

function clearStoredAnswers(uid: string) {
  try {
    window.localStorage.removeItem(STORAGE_KEY_PREFIX + uid);
  } catch {
    // best-effort only
  }
}

function ReadinessGate() {
  const { user, profile, loading } = useAuth();
  const [submission, setSubmission] = useState<ReadinessGateSubmission | null | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

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
          onClick={() => {
            clearStoredAnswers(user.uid);
            setShowForm(true);
          }}
          className="mt-4 rounded-full bg-tide px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  return <ReadinessGateForm key={user.uid} uid={user.uid} onSubmitted={() => setShowForm(false)} />;
}

function ReadinessGateForm({ uid, onSubmitted }: { uid: string; onSubmitted: () => void }) {
  const [answers, setAnswers] = useState<ReadinessRawAnswers>(() => loadStoredAnswers(uid));
  const [sectionIndex, setSectionIndex] = useState(0);
  const [furthestSectionIndex, setFurthestSectionIndex] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const section = READINESS_COURSE[sectionIndex];
  const isLastSection = sectionIndex === READINESS_COURSE.length - 1;

  function updateAnswer(itemId: string, value: string | number) {
    const next = { ...answers, [itemId]: value };
    setAnswers(next);
    storeAnswers(uid, next);
  }

  function sectionIsComplete(sectionIdx: number): boolean {
    return READINESS_COURSE[sectionIdx].items.every((item) => {
      const value = answers[item.id];
      if (item.type === "free_text") {
        return typeof value === "string" && value.trim().length >= 10;
      }
      return typeof value === "number";
    });
  }

  function handleNext() {
    if (!sectionIsComplete(sectionIndex)) {
      setError("Please answer every question in this section before continuing.");
      return;
    }
    setError("");
    const next = sectionIndex + 1;
    setSectionIndex(next);
    setFurthestSectionIndex((f) => Math.max(f, next));
  }

  function handleBack() {
    setError("");
    setSectionIndex((i) => Math.max(0, i - 1));
  }

  // Free-text answers lock once you've moved past their section — no
  // rewriting your reasoning after seeing later questions. Multiple
  // choice stays editable on a revisited section, since a misclick
  // carries none of that risk.
  const isRevisitingEarlierSection = sectionIndex < furthestSectionIndex;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allComplete = READINESS_COURSE.every((_, i) => sectionIsComplete(i));
    if (!allComplete) {
      setError("Please answer every question before submitting.");
      return;
    }
    setError("");
    setIsPending(true);
    try {
      const result = await submitReadinessGate(uid, answers);
      if (!result.ok) {
        setError(result.error);
      } else {
        clearStoredAnswers(uid);
        onSubmitted();
      }
    } catch {
      setError("Couldn't submit your answers. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={isLastSection ? handleSubmit : (e) => e.preventDefault()}
      className="flex flex-col gap-6 rounded-2xl border border-border-strong bg-paper-raised p-6 sm:p-8"
    >
      <div>
        <div className="flex items-center justify-between text-xs text-granite-soft">
          <span>
            Section {sectionIndex + 1} of {READINESS_COURSE.length}
          </span>
          <span>{section.title}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-paper">
          <div
            className="h-full rounded-full bg-tide transition-all"
            style={{ width: `${((sectionIndex + 1) / READINESS_COURSE.length) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="font-serif text-lg font-semibold">{section.title}</h2>

      {section.items.map((item) => (
        <div key={item.id}>
          <label htmlFor={item.id} className="mb-1.5 block text-sm font-medium text-ink">
            {item.prompt}
          </label>
          {item.type === "free_text" ? (
            <textarea
              id={item.id}
              rows={3}
              value={(answers[item.id] as string) ?? ""}
              onChange={(e) => updateAnswer(item.id, e.target.value)}
              disabled={isRevisitingEarlierSection}
              className="w-full rounded-2xl border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink outline-none transition-colors focus:border-tide disabled:cursor-not-allowed disabled:opacity-60"
            />
          ) : (
            <fieldset className="flex flex-col gap-2">
              {item.options.map((option, i) => (
                <label
                  key={i}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-strong bg-paper px-4 py-3 text-sm text-ink transition-colors has-[:checked]:border-tide has-[:checked]:bg-tide-bg"
                >
                  <input
                    type="radio"
                    name={item.id}
                    checked={answers[item.id] === i}
                    onChange={() => updateAnswer(item.id, i)}
                    className="mt-0.5"
                  />
                  {option}
                </label>
              ))}
            </fieldset>
          )}
        </div>
      ))}

      <div className="flex items-center justify-between gap-3">
        {sectionIndex > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-full border border-border-strong px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-tide cursor-pointer"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {isLastSection ? (
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer"
          >
            {isPending ? "Submitting…" : "Submit"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright cursor-pointer"
          >
            Next
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-gorse">
          {error}
        </p>
      )}
    </form>
  );
}
