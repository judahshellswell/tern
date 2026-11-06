"use client";

import { useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import { PRICING_PLANS, PRICING_PLAN_LABELS, type PricingPlan, type UserProfile } from "@/lib/types";
import { banUserAccount, unsuspendUserAccount, setEmployerPricingPlan } from "@/app/actions";
import { getIdToken } from "@/lib/id-token";
import { ReasonForm } from "@/components/admin/reason-form";
import { useRetryingSnapshot } from "@/lib/use-retrying-snapshot";

export function AllUsersQueue() {
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [banningUid, setBanningUid] = useState<string | null>(null);
  const [unsuspendingUid, setUnsuspendingUid] = useState<string | null>(null);

  useRetryingSnapshot(
    (onSuccess, onError) => {
      const q = query(
        collection(getClientFirestore(), "users"),
        where("verificationStatus", "in", ["approved", "suspended"]),
      );
      return onSnapshot(
        q,
        (snap) => {
          setError("");
          setUsers(snap.docs.map((d) => d.data() as UserProfile));
          onSuccess();
        },
        (err) => {
          setError("Couldn't load users — retrying…");
          onError(err.message);
        },
      );
    },
    [],
  );

  function profileName(profile: UserProfile) {
    return profile.role === "job_seeker" ? profile.displayName : profile.businessName;
  }

  const filtered = useMemo(() => {
    if (!users) return null;
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (profile) =>
        profileName(profile).toLowerCase().includes(term) ||
        profile.email.toLowerCase().includes(term),
    );
  }, [users, search]);

  async function ban(profile: UserProfile, reason: string) {
    await banUserAccount(await getIdToken(), profile.uid, reason);
    setBanningUid(null);
  }

  async function unsuspend(uid: string) {
    setUnsuspendingUid(uid);
    await unsuspendUserAccount(await getIdToken(), uid);
    setUnsuspendingUid(null);
  }

  async function changePlan(uid: string, plan: PricingPlan) {
    await setEmployerPricingPlan(await getIdToken(), uid, plan);
  }

  if (error) {
    return <p className="text-gorse">{error}</p>;
  }

  if (users === null) {
    return <p className="text-granite">Loading users…</p>;
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, business name, or email…"
        className="w-full rounded-full border border-border-strong bg-paper px-4 py-2 text-sm text-ink placeholder:text-granite-soft outline-none transition-colors focus:border-tide"
      />

      {filtered && filtered.length === 0 && (
        <div className="mt-4 rounded-2xl border border-border-strong bg-paper-raised p-6 text-center">
          <p className="text-granite">No matching users.</p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {filtered?.map((profile) => (
          <div
            key={profile.uid}
            className="rounded-2xl border border-border-strong bg-paper-raised p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wide text-granite-soft">
                  {profile.role === "job_seeker" ? "Job seeker" : "Employer"}
                  {profile.verificationStatus === "suspended" && " · Suspended"}
                </span>
                <p className="font-serif text-lg font-semibold">{profileName(profile)}</p>
                <p className="text-sm text-granite">{profile.email}</p>
                <p className="text-sm text-granite-soft">{profile.location}</p>
              </div>
              {profile.role === "employer" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-granite-soft">Plan</label>
                  <select
                    value={profile.pricingPlan ?? "trial"}
                    onChange={(e) => changePlan(profile.uid, e.target.value as PricingPlan)}
                    className="rounded-full border border-border-strong bg-paper px-3 py-1.5 text-sm font-medium text-ink outline-none transition-colors focus:border-tide"
                  >
                    {PRICING_PLANS.map((plan) => (
                      <option key={plan} value={plan}>
                        {PRICING_PLAN_LABELS[plan]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {banningUid === profile.uid ? (
              <ReasonForm
                kind="ban"
                onCancel={() => setBanningUid(null)}
                onConfirm={(reason) => ban(profile, reason)}
              />
            ) : (
              <div className="mt-4 flex gap-2">
                {profile.verificationStatus === "suspended" && (
                  <button
                    type="button"
                    disabled={unsuspendingUid === profile.uid}
                    onClick={() => unsuspend(profile.uid)}
                    className="rounded-full bg-tide px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-tide-bright cursor-pointer disabled:opacity-50"
                  >
                    Unsuspend
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setBanningUid(profile.uid)}
                  className="rounded-full bg-gorse px-4 py-2 text-sm font-semibold text-paper transition-colors hover:opacity-90 cursor-pointer"
                >
                  Ban
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
