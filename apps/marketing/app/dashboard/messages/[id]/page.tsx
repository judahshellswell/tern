"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth/auth-provider";
import { ChatThread } from "@/components/chat/chat-thread";
import { isAdminEmail } from "@/lib/admin";

export default function MessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const isEmployer = profile?.role === "employer";

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          {isEmployer ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="text-xs font-mono uppercase tracking-[0.1em] text-granite-soft hover:text-tide"
            >
              &larr; Back to applicants
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="text-xs font-mono uppercase tracking-[0.1em] text-granite-soft hover:text-tide"
            >
              &larr; Dashboard
            </Link>
          )}
          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight">Messages</h1>
          <div className="mt-6">
            {loading && <p className="text-granite">Loading…</p>}
            {!loading && !user && (
              <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
                <p className="text-granite">You need to be logged in to see this page.</p>
                <Link href="/log-in" className="mt-3 inline-block font-medium text-tide underline">
                  Log in
                </Link>
              </div>
            )}
            {!loading && user && (
              <ChatThread applicationId={id} viewerUid={user.uid} readOnly={isAdminEmail(user.email)} />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
