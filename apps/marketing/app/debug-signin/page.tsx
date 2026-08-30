"use client";

// TEMPORARY debug-only page for reproducing a live bug report. Signs
// into the already-configured client Firebase Auth instance using a
// custom token passed via ?token=, then redirects. Deleted immediately
// after use.
import { useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";

export default function DebugSignInPage() {
  const [status, setStatus] = useState("signing in...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("no token provided");
      return;
    }
    signInWithCustomToken(getClientAuth(), token)
      .then(() => setStatus("signed in"))
      .catch((err) => setStatus("error: " + err.message));
  }, []);

  return <p>{status}</p>;
}
