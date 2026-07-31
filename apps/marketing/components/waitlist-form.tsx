"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { joinWaitlist, type WaitlistFormState } from "@/app/actions";

const initialState: WaitlistFormState = { status: "idle", message: "" };

export function WaitlistForm({
  id,
  defaultRole = "job_seeker",
}: {
  id?: string;
  defaultRole?: "job_seeker" | "employer";
}) {
  const [state, formAction, isPending] = useActionState(joinWaitlist, initialState);
  const [role, setRole] = useState<"job_seeker" | "employer">(defaultRole);

  if (state.status === "success") {
    return (
      <div
        id={id}
        role="status"
        className="rounded-2xl border border-border-strong bg-paper-raised px-6 py-8 text-center animate-rise"
      >
        <p className="font-serif text-xl font-semibold text-tide">You&rsquo;re in.</p>
        <p className="mt-2 text-sm text-granite">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      id={id}
      action={formAction}
      className="rounded-2xl border border-border-strong bg-paper-raised p-6 sm:p-8 shadow-[0_1px_2px_rgba(18,33,30,0.06),0_8px_24px_rgba(18,33,30,0.05)]"
    >
      <fieldset className="mb-5">
        <legend className="mb-3 font-mono text-xs uppercase tracking-[0.1em] text-granite-soft">
          I&rsquo;m joining as
        </legend>
        <div className="flex gap-2" role="radiogroup">
          {(
            [
              { value: "job_seeker", label: "A job seeker" },
              { value: "employer", label: "An employer" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={role === option.value}
              onClick={() => setRole(option.value)}
              className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                role === option.value
                  ? "border-tide bg-tide text-paper"
                  : "border-border-strong text-ink hover:border-tide"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="role" value={role} />
      </fieldset>

      <label htmlFor="waitlist-email" className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          placeholder="you@example.je"
          className="min-w-0 flex-1 rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer"
        >
          {isPending ? "Joining…" : "Join the waitlist"}
        </button>
      </div>

      {state.status === "error" && (
        <p role="alert" className="mt-3 text-sm text-gorse">
          {state.message}
        </p>
      )}

      <p className="mt-4 text-xs text-granite-soft">
        Jersey-first. We&rsquo;ll never share your email, and you can
        unsubscribe anytime. See our{" "}
        <Link href="/privacy" className="underline hover:text-tide">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
