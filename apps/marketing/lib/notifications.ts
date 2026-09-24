import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "./firebase-admin";
import { sendPushToUser } from "./push";
import type { NotificationKind } from "./types";

// Best-effort in-app notification write (plus Web Push), mirroring an
// email already sent to the same uid. Never throws on its own — every call site
// wraps this the same way it already wraps the corresponding email
// send, so a Firestore write failure here can never block or fail the
// underlying action.
//
// Deliberately NOT in app/actions.ts: every export of a "use server"
// module is a publicly callable endpoint, and this takes an arbitrary
// uid + text — it would let anyone send any user a notification (and,
// now, a push to their phone).
export async function writeNotification(
  uid: string,
  kind: NotificationKind,
  title: string,
  body: string,
  link: string,
): Promise<void> {
  await getAdminFirestore()
    .collection("users")
    .doc(uid)
    .collection("notifications")
    .add({
      kind,
      title,
      body,
      link,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  // Also push it to any device the user has turned notifications on
  // for. sendPushToUser never throws, so this can't fail the write above.
  await sendPushToUser(uid, { title, body, link, tag: kind });
}
