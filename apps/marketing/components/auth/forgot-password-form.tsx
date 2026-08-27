"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/auth-actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsPending(true);
    try {
      await resetPassword(email);
    } catch (err) {
      // Only surface a genuinely malformed address — never reveal whether
      // an account exists for this email, which is why every other
      // outcome (including "no such user") still shows the success state.
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: unknown }).code === "auth/invalid-email"
      ) {
        setError("That doesn't look like a valid email address.");
        setIsPending(false);
        return;
      }
    }
    setSent(true);
    setIsPending(false);
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-border-strong bg-paper-raised px-6 py-8 text-center"
      >
        <p className="font-serif text-xl font-semibold text-tide">Check your email.</p>
        <p className="mt-2 text-sm text-granite">
          If there&rsquo;s an account for {email}, we&rsquo;ve sent a link to reset your
          password.
        </p>
        <Link
          href="/log-in"
          className="mt-4 inline-block text-sm font-medium text-tide underline hover:text-tide-bright"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-strong bg-paper-raised p-6 sm:p-8 shadow-[0_1px_2px_rgba(18,33,30,0.06),0_8px_24px_rgba(18,33,30,0.05)]"
    >
      <label className="sr-only" htmlFor="forgot-email">
        Email
      </label>
      <input
        id="forgot-email"
        type="email"
        required
        placeholder="you@example.je"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
      />
      <button
        type="submit"
        disabled={isPending}
        className="mt-3 w-full rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer"
      >
        {isPending ? "Sending…" : "Send reset link"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-gorse">
          {error}
        </p>
      )}

      <p className="mt-4 text-center text-sm text-granite">
        <Link href="/log-in" className="font-medium text-tide underline hover:text-tide-bright">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
