"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { getClientFirestore, getClientStorage } from "@/lib/firebase-client";
import type { UserProfile } from "@/lib/types";
import { notifyRejection, banUserAccount } from "@/app/actions";
import { ReasonForm } from "@/components/admin/reason-form";

type Action = { uid: string; kind: "reject" | "ban" };

export function AdminVerificationQueue() {
  const [pending, setPending] = useState<UserProfile[] | null>(null);
  const [activeAction, setActiveAction] = useState<Action | null>(null);

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

  function profileName(profile: UserProfile) {
    return profile.role === "job_seeker" ? profile.displayName : profile.businessName;
  }

  async function approve(uid: string) {
    const userRef = doc(getClientFirestore(), "users", uid);
    await updateDoc(userRef, { verificationStatus: "approved" });
  }

  async function reject(profile: UserProfile, reason: string) {
    const userRef = doc(getClientFirestore(), "users", profile.uid);
    await updateDoc(userRef, { verificationStatus: "rejected", rejectionReason: reason });
    void notifyRejection(profile.uid, profile.email, profileName(profile), reason);
    setActiveAction(null);
  }

  async function ban(profile: UserProfile, reason: string) {
    await banUserAccount(profile.uid, reason);
    setActiveAction(null);
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
              <p className="flex items-center gap-1.5 text-sm text-granite">
                {profile.email}
                {profile.emailVerified ? (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-tide">
                    &middot; email verified
                  </span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-granite-soft">
                    &middot; email unverified
                  </span>
                )}
              </p>
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
            <IdDocumentPreview path={profile.idDocumentPath} label="Photo ID" />
          )}

          {profile.role === "employer" && profile.logoPath && (
            <IdDocumentPreview path={profile.logoPath} label="Logo" />
          )}

          {activeAction?.uid === profile.uid ? (
            <ReasonForm
              kind={activeAction.kind}
              onCancel={() => setActiveAction(null)}
              onConfirm={(reason) =>
                activeAction.kind === "reject" ? reject(profile, reason) : ban(profile, reason)
              }
            />
          ) : (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => approve(profile.uid)}
                className="rounded-full bg-tide px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright cursor-pointer"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setActiveAction({ uid: profile.uid, kind: "reject" })}
                className="rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-gorse hover:text-gorse cursor-pointer"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => setActiveAction({ uid: profile.uid, kind: "ban" })}
                className="ml-auto rounded-full bg-gorse px-4 py-2 text-sm font-semibold text-paper transition-colors hover:opacity-90 cursor-pointer"
              >
                Ban
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function IdDocumentPreview({ path, label }: { path: string; label: string }) {
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
      <p className="mb-1.5 text-xs text-granite-soft">{label}</p>
      {failed && <p className="text-xs text-gorse">Couldn&rsquo;t load the document.</p>}
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
            alt={label}
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
