import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientFirestore } from "./firebase-client";

// Browser-side half of Web Push (server half is lib/push.ts). The
// subscription is written straight to Firestore by its owner — the
// rules only let a user write under their own uid — rather than via a
// server action, so there's no endpoint that would let one user attach
// a device to another user's account.

export type PushState =
  | "unsupported" // no service worker / Push API at all
  | "needs-install" // iOS Safari, not yet added to home screen
  | "denied" // user blocked notifications in browser settings
  | "off"
  | "on";

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  } catch (err) {
    console.error("Service worker registration failed:", err);
    return null;
  }
}

export async function getPushState(): Promise<PushState> {
  if (!("serviceWorker" in navigator)) return "unsupported";
  if (!("PushManager" in window) || !("Notification" in window)) {
    return isIOS() && !isStandalone() ? "needs-install" : "unsupported";
  }
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.getRegistration("/");
  const sub = await registration?.pushManager.getSubscription();
  return sub ? "on" : "off";
}

// Firestore doc ids can't contain "/", and endpoints are long URLs —
// hash to a stable id so re-subscribing the same device is idempotent.
async function subscriptionId(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function saveSubscription(uid: string, sub: PushSubscription): Promise<void> {
  const json = sub.toJSON();
  await setDoc(doc(getClientFirestore(), "users", uid, "pushSubscriptions", await subscriptionId(sub.endpoint)), {
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
    userAgent: navigator.userAgent.slice(0, 300),
    createdAt: serverTimestamp(),
  });
}

// Must be called from a user gesture (a click) — iOS rejects the
// permission prompt otherwise.
export async function enablePush(uid: string): Promise<PushState> {
  const registration = (await registerServiceWorker()) ?? null;
  if (!registration) return "unsupported";
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const sub =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    }));
  await saveSubscription(uid, sub);
  return "on";
}

export async function disablePush(uid: string): Promise<PushState> {
  const registration = await navigator.serviceWorker.getRegistration("/");
  const sub = await registration?.pushManager.getSubscription();
  if (sub) {
    await deleteDoc(doc(getClientFirestore(), "users", uid, "pushSubscriptions", await subscriptionId(sub.endpoint)));
    await sub.unsubscribe();
  }
  return "off";
}

// If this device is already subscribed, make sure the subscription is
// stored against whoever is logged in now (covers a device switching
// accounts, or a subscription the browser silently rotated).
export async function syncExistingSubscription(uid: string): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration("/");
  const sub = await registration?.pushManager.getSubscription();
  if (sub && Notification.permission === "granted") await saveSubscription(uid, sub);
}
