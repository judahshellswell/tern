import webpush from "web-push";
import { getAdminFirestore } from "./firebase-admin";

// Server-side Web Push. Subscriptions live at
// users/{uid}/pushSubscriptions/{id}, written by the owner's own browser
// (see lib/push-client.ts and the matching firestore.rules block), one
// doc per device. Sending is best-effort, same contract as the email and
// in-app notification it mirrors — never throws.

let configured: boolean | null = null;

function configure(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn("Web Push disabled: missing NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY.");
    configured = false;
    return configured;
  }
  webpush.setVapidDetails("mailto:hello@tern.je", publicKey, privateKey);
  configured = true;
  return configured;
}

export async function sendPushToUser(
  uid: string,
  payload: { title: string; body: string; link: string; tag?: string },
): Promise<void> {
  if (!configure()) return;

  try {
    const snap = await getAdminFirestore()
      .collection("users")
      .doc(uid)
      .collection("pushSubscriptions")
      .get();
    if (snap.empty) return;

    const message = JSON.stringify(payload);
    await Promise.all(
      snap.docs.map(async (d) => {
        const { endpoint, p256dh, auth } = d.data() as { endpoint: string; p256dh: string; auth: string };
        try {
          await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, message, { TTL: 60 * 60 * 24 });
        } catch (err) {
          // 404/410 mean the browser has dropped this subscription
          // (uninstalled, permission revoked, expired) — clean it up so
          // we stop sending to it.
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await d.ref.delete();
          } else {
            console.error("Web Push send failed:", status, err);
          }
        }
      }),
    );
  } catch (err) {
    console.error("Failed to send push notifications:", err);
  }
}
