"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";
import { getIdToken } from "@/lib/id-token";
import { deleteMyAccount } from "@/app/account-actions";
import type { UserRole } from "@/lib/types";

const CONFIRM_WORD = "DELETE";

export function DeleteAccountSection({ role }: { role: UserRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setError("");
    setIsPending(true);
    try {
      const result = await deleteMyAccount(await getIdToken());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await signOut(getClientAuth()).catch(() => {});
      router.push("/");
    } catch {
      setError("Something went wrong deleting your account. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 block text-sm text-granite-soft underline hover:text-gorse cursor-pointer"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-gorse/40 bg-paper-raised p-6">
      <p className="font-serif text-lg font-semibold">Delete your account</p>
      <p className="mt-2 text-sm text-granite">
        This permanently deletes your account and can&rsquo;t be undone. We
        will delete your sign-in, your profile,{" "}
        {role === "job_seeker"
          ? "your portfolio, CV, readiness answers, interview booking, applications and messages"
          : "your logo, job listings, the applications you've received and your messages"}
        . Reports involving your account and billing records are kept for a
        limited time for safety and legal reasons, with your name removed,
        as explained in our{" "}
        <a href="/privacy" className="underline hover:text-tide">
          privacy policy
        </a>
        .
      </p>

      <label htmlFor="delete-confirm" className="mt-4 mb-1.5 block text-xs font-medium text-granite">
        Type {CONFIRM_WORD} to confirm
      </label>
      <input
        id="delete-confirm"
        type="text"
        autoComplete="off"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink outline-none transition-colors focus:border-gorse"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending || confirmText.trim() !== CONFIRM_WORD}
          className="rounded-full bg-gorse px-5 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? "Deleting…" : "Permanently delete account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmText("");
            setError("");
          }}
          disabled={isPending}
          className="rounded-full border border-border-strong px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-tide cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-gorse">
          {error}
        </p>
      )}
    </div>
  );
}
