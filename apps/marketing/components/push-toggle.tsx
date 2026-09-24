"use client";

import { useEffect, useState } from "react";
import {
  disablePush,
  enablePush,
  getPushState,
  registerServiceWorker,
  syncExistingSubscription,
  type PushState,
} from "@/lib/push-client";

// Footer of the notification bell: lets the user get the same
// notifications as phone/desktop push. On iOS, push only exists once
// Tern is added to the home screen, so we explain that instead.
export function PushToggle({ uid }: { uid: string }) {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await registerServiceWorker();
      try {
        await syncExistingSubscription(uid);
      } catch (err) {
        console.error("Failed to sync push subscription:", err);
      }
      const next = await getPushState();
      if (!cancelled) setState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  async function toggle() {
    setBusy(true);
    try {
      setState(state === "on" ? await disablePush(uid) : await enablePush(uid));
    } catch (err) {
      console.error("Failed to change push setting:", err);
      setState(await getPushState());
    } finally {
      setBusy(false);
    }
  }

  if (state === null || state === "unsupported") return null;

  return (
    <div className="border-t border-border px-4 py-3 text-xs text-granite">
      {state === "needs-install" && (
        <p>
          <span className="font-medium text-ink">Get these on your phone:</span> tap Share, then{" "}
          &ldquo;Add to Home Screen&rdquo;, and open Tern from there.
        </p>
      )}
      {state === "denied" && (
        <p>Notifications are blocked for Tern. Turn them on in your browser or phone settings.</p>
      )}
      {(state === "off" || state === "on") && (
        <div className="flex items-center justify-between gap-3">
          <p>{state === "on" ? "Push notifications are on for this device." : "Get these on this device too."}</p>
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
              state === "on"
                ? "border border-border-strong text-ink hover:border-tide"
                : "bg-tide text-paper hover:bg-tide-bright"
            }`}
          >
            {busy ? "…" : state === "on" ? "Turn off" : "Turn on"}
          </button>
        </div>
      )}
    </div>
  );
}
