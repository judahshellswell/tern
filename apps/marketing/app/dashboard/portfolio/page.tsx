"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { addPortfolioEntry, deletePortfolioEntry } from "@/lib/portfolio";
import type { PortfolioEntry } from "@/lib/types";

export default function PortfolioPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-tide">Job seeker</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">Your portfolio.</h1>
          <p className="mt-2 text-granite">
            Add achievements, activities, or anything that shows what you can bring —
            employers you&rsquo;ve applied to will be able to see this.
          </p>
          <div className="mt-8">
            <Portfolio />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Portfolio() {
  const { user, profile, loading } = useAuth();
  const [entries, setEntries] = useState<PortfolioEntry[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(getClientFirestore(), "users", user.uid, "portfolioEntries"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PortfolioEntry));
    });
    return unsubscribe;
  }, [user]);

  if (loading) {
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
        <p className="text-granite">Only job seeker accounts have a portfolio.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AddEntryForm uid={user.uid} />

      {entries === null && <p className="text-granite">Loading entries…</p>}

      {entries !== null && entries.length === 0 && (
        <div className="rounded-2xl border border-border-strong bg-paper-raised p-8 text-center">
          <p className="font-serif text-lg font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-granite">
            Add your first entry above — sports teams, volunteering, school projects, anything.
          </p>
        </div>
      )}

      {entries !== null && entries.length > 0 && (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-border-strong bg-paper-raised p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-serif text-lg font-semibold">{entry.title}</p>
                <button
                  type="button"
                  onClick={() => deletePortfolioEntry(user.uid, entry.id)}
                  className="text-sm text-granite-soft underline hover:text-gorse cursor-pointer"
                >
                  Delete
                </button>
              </div>
              {entry.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{entry.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddEntryForm({ uid }: { uid: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsPending(true);
    try {
      await addPortfolioEntry(uid, { title, description });
      setTitle("");
      setDescription("");
    } catch {
      setError("Couldn't save that. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-strong bg-paper-raised p-6 sm:p-8 shadow-[0_1px_2px_rgba(18,33,30,0.06),0_8px_24px_rgba(18,33,30,0.05)]"
    >
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="entry-title" className="mb-1.5 block text-xs font-medium text-granite">
            Title
          </label>
          <input
            id="entry-title"
            type="text"
            required
            placeholder="Member of U16 football Jersey team"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
          />
        </div>
        <div>
          <label
            htmlFor="entry-description"
            className="mb-1.5 block text-xs font-medium text-granite"
          >
            Description
          </label>
          <textarea
            id="entry-description"
            rows={3}
            placeholder="What did it involve, and what did you get out of it?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-2xl border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed self-start"
        >
          {isPending ? "Adding…" : "Add entry"}
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
