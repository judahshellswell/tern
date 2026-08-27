"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logInWithEmail, signInWithGoogle, authErrorMessage } from "@/lib/auth-actions";

export function LogInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleEmailLogIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsPending(true);
    try {
      await logInWithEmail(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  }

  async function handleGoogleLogIn() {
    setError("");
    setIsPending(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 sm:p-8 shadow-[0_1px_2px_rgba(18,33,30,0.06),0_8px_24px_rgba(18,33,30,0.05)]">
      <button
        type="button"
        onClick={handleGoogleLogIn}
        disabled={isPending}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] font-semibold text-ink transition-colors hover:border-tide disabled:opacity-60 cursor-pointer"
      >
        Continue with Google
      </button>

      <div className="mb-4 flex items-center gap-3 text-xs text-granite-soft">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmailLogIn} className="flex flex-col gap-3">
        <label className="sr-only" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          required
          placeholder="you@example.je"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
        />
        <label className="sr-only" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
        />
        <Link
          href="/forgot-password"
          className="-mt-1 self-end text-xs font-medium text-tide underline hover:text-tide-bright"
        >
          Forgot password?
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer"
        >
          {isPending ? "Logging in…" : "Log in"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-gorse">
          {error}
        </p>
      )}

      <p className="mt-4 text-center text-sm text-granite">
        No account yet?{" "}
        <Link href="/sign-up" className="font-medium text-tide underline hover:text-tide-bright">
          Sign up
        </Link>
      </p>
    </div>
  );
}
