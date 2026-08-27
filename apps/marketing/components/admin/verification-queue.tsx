"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { getClientFirestore, getClientStorage } from "@/lib/firebase-client";
import { isAdminEmail } from "@/lib/admin";
import { useAuth } from "@/components/auth/auth-provider";
import type { UserProfile } from "@/lib/types";

export function AdminVerificationQueue() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <p className="text-granite">Loading…</p>;
  }

  if (!user || !isAdminEmail(user.email)) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">
          You need to be logged in as an admin to see this page.
        </p>
        <Link href="/log-in" className="mt-3 inline-block font-medium text-tide underline">
          Log in
        </Link>
      </div>
    );
  }

  return <Queue />;
}

function Queue() {
  const [pending, setPending] = useState<UserProfile[] | null>(null);

  useEffect(() => {
    const q = query(
      collection(getClientFirestore(), "users"),
      where("verificationStatus", "==", "pending"),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setPending(snap.docs.map((d) => d.data() as UserProfile));
    });
    return unsubscribe;
  }, []);

  async function decide(uid: string, decision: "approved" | "rejected") {
    const ref = doc(getClientFirestore(), "users", uid);
    await updateDoc(ref, { verificationStatus: decision });
  }

  if (pending === null) {
    return <p className="text-granite">Loading queue…</p>;
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 text-center">
        <p className="text-granite">Nothing pending review.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pending.map((profile) => (
        <div
          key={profile.uid}
          className="rounded-2xl border border-border-strong bg-paper-raised p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wide text-granite-soft">
                {profile.role === "job_seeker" ? "Job seeker" : "Employer"}
              </span>
              <p className="font-serif text-lg font-semibold">
                {profile.role === "job_seeker" ? profile.displayName : profile.businessName}
              </p>
              <p className="text-sm text-granite">{profile.email}</p>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {profile.role === "job_seeker" ? (
              <>
                <DetailRow label="Date of birth" value={profile.dateOfBirth} />
                <DetailRow label="Location" value={profile.location} />
                {profile.guardianEmail && (
                  <DetailRow label="Guardian email" value={profile.guardianEmail} />
                )}
              </>
            ) : (
              <>
                <DetailRow label="Registration no." value={profile.registrationNumber} />
                <DetailRow label="Location" value={profile.location} />
              </>
            )}
          </dl>

          {profile.role === "employer" && profile.isFreeEmailDomain && (
            <p className="mt-3 rounded-lg bg-gorse-bg px-3 py-2 text-xs text-gorse">
              Signed up with a personal email address (not a business
              domain) &mdash; worth extra scrutiny before approving.
            </p>
          )}

          {profile.role === "job_seeker" && profile.idDocumentPath && (
            <IdDocumentPreview path={profile.idDocumentPath} />
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => decide(profile.uid, "approved")}
              className="rounded-full bg-tide px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright cursor-pointer"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => decide(profile.uid, "rejected")}
              className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-gorse hover:text-gorse cursor-pointer"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function IdDocumentPreview({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isPdf = path.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    let cancelled = false;
    getDownloadURL(ref(getClientStorage(), path))
      .then((downloadUrl) => {
        if (!cancelled) setUrl(downloadUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs text-granite-soft">Photo ID</p>
      {failed && <p className="text-xs text-gorse">Couldn&rsquo;t load the ID document.</p>}
      {!failed && !url && <p className="text-xs text-granite-soft">Loading…</p>}
      {url && isPdf && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm font-medium text-tide underline hover:text-tide-bright"
        >
          View uploaded PDF
        </a>
      )}
      {url && !isPdf && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Image
            src={url}
            alt="Uploaded ID document"
            width={240}
            height={160}
            unoptimized
            className="rounded-lg border border-border-strong object-cover"
          />
        </a>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-granite-soft">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
