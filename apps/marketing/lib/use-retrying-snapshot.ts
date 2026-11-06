import { useEffect, useRef } from "react";
import type { Unsubscribe } from "firebase/firestore";

// Firestore's onSnapshot error callback is terminal — once it fires,
// that listener is dead and nothing re-subscribes on its own. A brief
// permission or connectivity hiccup right after sign-in (the token
// hasn't finished attaching to the very first request) then leaves a
// query permanently stuck showing an error until the whole page is
// hard-refreshed and a fresh listener is created from scratch. This
// hook re-subscribes automatically with backoff instead, so a
// transient failure recovers on its own without a manual refresh.
//
// The caller passes a subscribe(onSuccess, onError) function that
// builds its own query/ref and calls onSnapshot itself — a fresh
// query object on every retry, never one tied to the attempt that
// failed. onSuccess() should be called from inside the caller's own
// success handler so the retry counter resets once data comes back.
export function useRetryingSnapshot(
  subscribe: (onSuccess: () => void, onError: (message: string) => void) => Unsubscribe,
  deps: unknown[],
) {
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: Unsubscribe | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    function start() {
      if (cancelled) return;
      unsubscribe = subscribe(
        () => {
          attempt = 0;
        },
        (message) => {
          attempt += 1;
          // Capped exponential backoff: 1s, 2s, 4s, 8s, then settle at
          // 8s — fast enough to recover from a real transient hiccup
          // without hammering Firestore if the underlying cause (e.g.
          // undeployed rules) isn't transient at all.
          const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
          console.error("Snapshot listener failed (attempt " + attempt + "): " + message);
          if (unsubscribe) unsubscribe();
          retryTimer = setTimeout(() => {
            if (!cancelled) start();
          }, delay);
        },
      );
    }

    start();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
