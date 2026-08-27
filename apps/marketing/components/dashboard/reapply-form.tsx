"use client";

import { useState } from "react";
import { isUnder18, isUnderMinimumAge, MINIMUM_AGE, type UserProfile } from "@/lib/types";
import { createJobSeekerProfile, createEmployerProfile } from "@/lib/profile";
import { uploadIdDocument, validateIdDocument } from "@/lib/id-upload";
import { notifyAdminOfSignup } from "@/app/actions";

export function ReapplyForm({
  profile,
  onDone,
}: {
  profile: UserProfile;
  onDone: () => void;
}) {
  const [displayName, setDisplayName] = useState(
    profile.role === "job_seeker" ? profile.displayName : "",
  );
  const [dateOfBirth, setDateOfBirth] = useState(
    profile.role === "job_seeker" ? profile.dateOfBirth : "",
  );
  const [guardianEmail, setGuardianEmail] = useState(
    profile.role === "job_seeker" ? (profile.guardianEmail ?? "") : "",
  );
  const [businessName, setBusinessName] = useState(
    profile.role === "employer" ? profile.businessName : "",
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    profile.role === "employer" ? profile.registrationNumber : "",
  );
  const [location, setLocation] = useState(profile.location);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idFileError, setIdFileError] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const under18 = dateOfBirth ? isUnder18(dateOfBirth) : false;
  const underMinimumAge = dateOfBirth ? isUnderMinimumAge(dateOfBirth) : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (profile.role === "job_seeker" && underMinimumAge) {
      setError(`You need to be at least ${MINIMUM_AGE} to use Tern.`);
      return;
    }
    if (profile.role === "job_seeker" && !idFile) {
      setError("Please upload a photo ID to continue.");
      return;
    }
    setError("");
    setIsPending(true);
    try {
      if (profile.role === "job_seeker" && idFile) {
        const idDocumentPath = await uploadIdDocument(profile.uid, idFile);
        await createJobSeekerProfile(profile.uid, profile.email, {
          displayName,
          dateOfBirth,
          guardianEmail,
          location,
          idDocumentPath,
        });
        void notifyAdminOfSignup("job_seeker", displayName, profile.email);
      } else {
        await createEmployerProfile(profile.uid, profile.email, {
          businessName,
          registrationNumber,
          location,
        });
        void notifyAdminOfSignup("employer", businessName, profile.email);
      }
      onDone();
    } catch {
      setError("Couldn't save your details. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-border-strong bg-paper p-4"
    >
      <p className="mb-3 text-xs font-medium text-granite">
        Update your details and resubmit for review.
      </p>

      <div className="flex flex-col gap-3">
        {profile.role === "job_seeker" ? (
          <>
            <Field label="Full name" value={displayName} onChange={setDisplayName} />
            <Field
              label="Date of birth"
              type="date"
              value={dateOfBirth}
              onChange={setDateOfBirth}
            />
            {dateOfBirth && underMinimumAge && (
              <p role="alert" className="-mt-1 rounded-lg bg-gorse-bg px-3 py-2 text-xs text-gorse">
                You need to be at least {MINIMUM_AGE} to use Tern.
              </p>
            )}
            {dateOfBirth && under18 && !underMinimumAge && (
              <Field
                label="Parent or guardian email"
                type="email"
                value={guardianEmail}
                onChange={setGuardianEmail}
              />
            )}
            <Field label="Location" value={location} onChange={setLocation} />
            <div>
              <label
                htmlFor="reapply-id-upload"
                className="mb-1.5 block text-xs font-medium text-granite"
              >
                Photo ID
              </label>
              <input
                id="reapply-id-upload"
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
                className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border file:border-border-strong file:bg-paper-raised file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:border-tide file:cursor-pointer"
              />
              <p className="mt-1.5 text-xs text-granite-soft">
                Upload a new clear photo, even if you uploaded one before.
              </p>
              {idFileError && (
                <p role="alert" className="mt-1.5 text-xs text-gorse">
                  {idFileError}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <Field label="Business name" value={businessName} onChange={setBusinessName} />
            <Field
              label="Business registration number"
              value={registrationNumber}
              onChange={setRegistrationNumber}
            />
            <Field label="Location" value={location} onChange={setLocation} />
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={
          isPending || (profile.role === "job_seeker" && (underMinimumAge || !idFile))
        }
        className="mt-4 rounded-full bg-tide px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? "Submitting…" : "Resubmit for review"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-gorse">
          {error}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = `reapply-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-granite">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border-strong bg-paper-raised px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-tide"
      />
    </div>
  );
}
