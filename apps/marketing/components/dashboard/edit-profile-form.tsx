"use client";

import { useState } from "react";
import type { UserProfile } from "@/lib/types";
import { updateJobSeekerDetails, updateEmployerDetails } from "@/lib/profile";
import { uploadEmployerLogo, validateLogo } from "@/lib/logo-upload";

export function EditProfileForm({
  profile,
  onDone,
}: {
  profile: UserProfile;
  onDone: () => void;
}) {
  const [displayName, setDisplayName] = useState(
    profile.role === "job_seeker" ? profile.displayName : "",
  );
  const [businessName, setBusinessName] = useState(
    profile.role === "employer" ? profile.businessName : "",
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    profile.role === "employer" ? profile.registrationNumber : "",
  );
  const [location, setLocation] = useState(profile.location);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileError, setLogoFileError] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsPending(true);
    try {
      if (profile.role === "job_seeker") {
        await updateJobSeekerDetails(profile.uid, { displayName, location });
      } else {
        const logoPath = logoFile ? (await uploadEmployerLogo(profile.uid, logoFile)).path : undefined;
        await updateEmployerDetails(profile.uid, {
          businessName,
          registrationNumber,
          location,
          logoPath,
        });
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
      <div className="flex flex-col gap-3">
        {profile.role === "job_seeker" ? (
          <Field label="Full name" value={displayName} onChange={setDisplayName} />
        ) : (
          <>
            <Field label="Business name" value={businessName} onChange={setBusinessName} />
            <Field
              label="Business registration number"
              value={registrationNumber}
              onChange={setRegistrationNumber}
            />
          </>
        )}
        <Field label="Location" value={location} onChange={setLocation} />

        {profile.role === "employer" && (
          <div>
            <label
              htmlFor="edit-logo-upload"
              className="mb-1.5 block text-xs font-medium text-granite"
            >
              Logo (optional)
            </label>
            <input
              id="edit-logo-upload"
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
              className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border file:border-border-strong file:bg-paper-raised file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:border-tide file:cursor-pointer"
            />
            <p className="mt-1.5 text-xs text-granite-soft">
              Only upload a new file if you want to replace your current logo.
            </p>
            {logoFileError && (
              <p role="alert" className="mt-1.5 text-xs text-gorse">
                {logoFileError}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 rounded-full bg-tide px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? "Saving…" : "Save changes"}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `edit-profile-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-granite">
        {label}
      </label>
      <input
        id={id}
        type="text"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border-strong bg-paper-raised px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-tide"
      />
    </div>
  );
}
