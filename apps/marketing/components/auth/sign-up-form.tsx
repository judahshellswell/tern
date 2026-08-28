"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserRole } from "@/lib/types";
import { isUnder18, isUnderMinimumAge, MINIMUM_AGE } from "@/lib/types";
import { signUpWithEmail, signInWithGoogle, authErrorMessage, sendVerificationEmail } from "@/lib/auth-actions";
import { createJobSeekerProfile, createEmployerProfile, getProfile } from "@/lib/profile";
import { notifyGuardian, notifyAdminOfSignup } from "@/app/actions";
import { uploadIdDocument, validateIdDocument } from "@/lib/id-upload";
import { uploadEmployerLogo, validateLogo } from "@/lib/logo-upload";

type Step = "role" | "account" | "details";

export function SignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [location, setLocation] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idFileError, setIdFileError] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileError, setLogoFileError] = useState("");

  const under18 = dateOfBirth ? isUnder18(dateOfBirth) : false;
  const underMinimumAge = dateOfBirth ? isUnderMinimumAge(dateOfBirth) : false;

  function chooseRole(nextRole: UserRole) {
    setRole(nextRole);
    setStep("account");
  }

  async function handleGoogleSignIn() {
    setError("");
    setIsPending(true);
    try {
      const credential = await signInWithGoogle();
      const existing = await getProfile(credential.user.uid);
      if (existing) {
        router.push("/dashboard");
        return;
      }
      setUid(credential.user.uid);
      setEmail(credential.user.email ?? "");
      setEmailVerified(credential.user.emailVerified);
      setStep("details");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsPending(true);
    try {
      const credential = await signUpWithEmail(email, password);
      setUid(credential.user.uid);
      setEmailVerified(credential.user.emailVerified);
      // Best-effort — never blocks or delays moving to the next step.
      void sendVerificationEmail(credential.user);
      setStep("details");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  }

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !role) return;
    if (role === "job_seeker" && isUnderMinimumAge(dateOfBirth)) {
      setError(`You need to be at least ${MINIMUM_AGE} to use Tern.`);
      return;
    }
    if (role === "job_seeker" && !idFile) {
      setError("Please upload a photo ID to continue.");
      return;
    }
    if (role === "employer" && !logoFile) {
      setError("Please upload a logo to continue.");
      return;
    }
    setError("");
    setIsPending(true);
    try {
      if (role === "job_seeker" && idFile) {
        const idDocumentPath = await uploadIdDocument(uid, idFile);
        await createJobSeekerProfile(
          uid,
          email,
          {
            displayName,
            dateOfBirth,
            guardianEmail,
            location,
            idDocumentPath,
          },
          emailVerified,
        );
        if (under18 && guardianEmail) {
          // Best-effort — the account is already created either way, and
          // the form doesn't block on or surface failures from this.
          void notifyGuardian(guardianEmail, displayName);
        }
        void notifyAdminOfSignup("job_seeker", displayName, email);
      } else if (logoFile) {
        const { path: logoPath } = await uploadEmployerLogo(uid, logoFile);
        await createEmployerProfile(
          uid,
          email,
          {
            businessName,
            registrationNumber,
            location,
            logoPath,
          },
          emailVerified,
        );
        void notifyAdminOfSignup("employer", businessName, email);
      }
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Couldn't save your details. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  if (step === "role") {
    return (
      <div className="flex flex-col gap-3">
        <RoleCard
          title="I'm a job seeker"
          body="Build a profile, get verified, and apply to part-time, apprenticeship, internship, temporary and seasonal roles."
          onClick={() => chooseRole("job_seeker")}
        />
        <RoleCard
          title="I'm an employer"
          body="Verify your business, then post roles and review applicants."
          onClick={() => chooseRole("employer")}
        />
        <p className="mt-2 text-center text-sm text-granite">
          Already have an account?{" "}
          <Link href="/log-in" className="font-medium text-tide underline hover:text-tide-bright">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  if (step === "account") {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 sm:p-8 shadow-[0_1px_2px_rgba(18,33,30,0.06),0_8px_24px_rgba(18,33,30,0.05)]">
        <button
          type="button"
          onClick={() => setStep("role")}
          className="mb-5 text-xs font-mono uppercase tracking-[0.1em] text-granite-soft hover:text-tide"
        >
          &larr; Back
        </button>

        <button
          type="button"
          onClick={handleGoogleSignIn}
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

        <form onSubmit={handleEmailSignUp} className="flex flex-col gap-3">
          <label className="sr-only" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            required
            placeholder="you@example.je"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
          />
          <label className="sr-only" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            required
            minLength={6}
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer"
          >
            {isPending ? "Creating account…" : "Continue"}
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-3 text-sm text-gorse">
            {error}
          </p>
        )}
      </div>
    );
  }

  // step === "details"
  return (
    <form
      onSubmit={handleDetailsSubmit}
      className="rounded-2xl border border-border-strong bg-paper-raised p-6 sm:p-8 shadow-[0_1px_2px_rgba(18,33,30,0.06),0_8px_24px_rgba(18,33,30,0.05)]"
    >
      <p className="mb-5 font-mono text-xs uppercase tracking-[0.1em] text-granite-soft">
        {role === "job_seeker" ? "Tell us about you" : "Tell us about your business"}
      </p>

      {role === "job_seeker" ? (
        <div className="flex flex-col gap-3">
          <Field
            label="Full name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Amelie Marett"
          />
          <Field
            label="Date of birth"
            type="date"
            value={dateOfBirth}
            onChange={setDateOfBirth}
          />
          {dateOfBirth && underMinimumAge && (
            <p role="alert" className="-mt-1 rounded-lg bg-gorse-bg px-3 py-2 text-xs text-gorse">
              You need to be at least {MINIMUM_AGE} to use Tern. Come back
              once you turn {MINIMUM_AGE} &mdash; we&rsquo;d love to have
              you then.
            </p>
          )}
          {dateOfBirth && under18 && !underMinimumAge && (
            <>
              <Field
                label="Parent or guardian email"
                type="email"
                value={guardianEmail}
                onChange={setGuardianEmail}
                placeholder="parent@example.je"
              />
              <p className="-mt-1 text-xs text-granite-soft">
                Since you&rsquo;re under 18, we&rsquo;ll let your parent or
                guardian know you&rsquo;ve joined Tern.
              </p>
            </>
          )}
          <Field
            label="Location"
            value={location}
            onChange={setLocation}
            placeholder="St Helier, Jersey"
          />
          <div>
            <label htmlFor="id-upload" className="mb-1.5 block text-xs font-medium text-granite">
              Photo ID
            </label>
            <input
              id="id-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file) {
                  const validationError = validateIdDocument(file);
                  setIdFileError(validationError ?? "");
                  setIdFile(validationError ? null : file);
                } else {
                  setIdFile(null);
                  setIdFileError("");
                }
              }}
              className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border file:border-border-strong file:bg-paper file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:border-tide file:cursor-pointer"
            />
            <p className="mt-1.5 text-xs text-granite-soft">
              A passport, driving licence, or school/college ID &mdash;
              used only to confirm the details above and never shown to
              employers.
            </p>
            {idFileError && (
              <p role="alert" className="mt-1.5 text-xs text-gorse">
                {idFileError}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Field
            label="Business name"
            value={businessName}
            onChange={setBusinessName}
            placeholder="Acme Ltd"
          />
          <Field
            label="Business registration number"
            value={registrationNumber}
            onChange={setRegistrationNumber}
            placeholder="JFSC registration number"
          />
          <Field
            label="Location"
            value={location}
            onChange={setLocation}
            placeholder="St Helier, Jersey"
          />
          <div>
            <label htmlFor="logo-upload" className="mb-1.5 block text-xs font-medium text-granite">
              Logo
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file) {
                  const validationError = validateLogo(file);
                  setLogoFileError(validationError ?? "");
                  setLogoFile(validationError ? null : file);
                } else {
                  setLogoFile(null);
                  setLogoFileError("");
                }
              }}
              className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border file:border-border-strong file:bg-paper file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:border-tide file:cursor-pointer"
            />
            <p className="mt-1.5 text-xs text-granite-soft">
              Shown on your job listings so candidates can recognise you.
            </p>
            {logoFileError && (
              <p role="alert" className="mt-1.5 text-xs text-gorse">
                {logoFileError}
              </p>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={
          isPending ||
          (role === "job_seeker" && (underMinimumAge || !idFile)) ||
          (role === "employer" && !logoFile)
        }
        className="mt-5 w-full rounded-full bg-tide px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? "Saving…" : "Create account"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-gorse">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs text-granite-soft">
        You&rsquo;ll need to be verified before you can{" "}
        {role === "job_seeker" ? "apply to jobs" : "post a job"}. See our{" "}
        <Link href="/privacy" className="underline hover:text-tide">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

function RoleCard({
  title,
  body,
  onClick,
}: {
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-border-strong bg-paper-raised p-6 text-left transition-colors hover:border-tide cursor-pointer"
    >
      <p className="font-serif text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-granite">{body}</p>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-granite">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border-strong bg-paper px-5 py-3 text-[15px] text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
      />
    </div>
  );
}
