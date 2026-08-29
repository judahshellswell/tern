"use client";

import Link from "next/link";
import { isAdminEmail } from "@/lib/admin";
import { useAuth } from "@/components/auth/auth-provider";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-granite">Loading…</p>;
  }

  if (!user || !isAdminEmail(user.email)) {
    return (
      <div className="rounded-2xl border border-border-strong bg-paper-raised p-6">
        <p className="text-granite">You need to be logged in as an admin to see this page.</p>
        <Link href="/log-in" className="mt-3 inline-block font-medium text-tide underline">
          Log in
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
