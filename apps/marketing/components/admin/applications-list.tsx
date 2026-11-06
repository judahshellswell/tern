"use client";

import { useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { APPLICATION_STATUS_LABELS, type Application } from "@/lib/types";
import { useRetryingSnapshot } from "@/lib/use-retrying-snapshot";
import { deleteApplication } from "@/app/actions";
import { getIdToken } from "@/lib/id-token";

// Admin-only view for deleting a stray test/demo application directly —
// otherwise there's no way to remove one short of letting the applicant
// withdraw it themselves (which still leaves the record, by design —
// see the withdraw rule's comment in firestore.rules).
export function ApplicationsList() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(application: Application) {
    const confirmed = window.confirm(
      `Permanently delete the application from "${application.applicantName}" for "${application.jobTitle}"? This also deletes their conversation, if any. This can't be undone.`,
    );
    if (!confirmed) return;
    setDeletingId(application.id);
    const result = await deleteApplication(await getIdToken(), application.id).catch(() => null);
    if (!result?.ok) {
      window.alert("Couldn't delete this application. Please try again.");
    }
    setDeletingId(null);
  }

  useRetryingSnapshot(
    (onSuccess, onError) => {
      const q = query(collection(getClientFirestore(), "applications"), orderBy("createdAt", "desc"));
      return onSnapshot(
        q,
        (snap) => {
          setError("");
          setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Application));
          onSuccess();
        },
        (err) => {
          setError("Couldn't load applications — retrying…");
          onError(err.message);
        },
      );
    },
    [],
  );

  if (error) {
    return <p className="text-gorse">{error}</p>;
  }

  if (applications === null) {
    return <p className="text-granite">Loading applications…</p>;
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6 text-center">
        <p className="text-granite">No applications yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {applications.map((application) => (
        <div key={application.id} className="rounded-2xl border border-border-strong bg-paper-raised p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-serif text-lg font-semibold">
                {application.applicantName} &rarr; {application.employerName}
              </p>
              <p className="text-sm text-granite">{application.jobTitle}</p>
            </div>
            <span className="rounded-full bg-tide/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-tide">
              {APPLICATION_STATUS_LABELS[application.status]}
            </span>
          </div>
          <div className="mt-2 flex items-end justify-end">
            <button
              type="button"
              disabled={deletingId === application.id}
              onClick={() => handleDelete(application)}
              className="rounded-full bg-gorse px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {deletingId === application.id ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
