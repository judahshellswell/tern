import { getClientAuth } from "./firebase-client";

// The signed-in user's Firebase ID token, passed as the first argument
// to every server action that needs to know who's calling (verified
// server-side by lib/server-auth.ts). The SDK caches it and refreshes it
// automatically when it's close to expiring.
export async function getIdToken(): Promise<string> {
  const user = getClientAuth().currentUser;
  if (!user) throw new Error("Not signed in.");
  return user.getIdToken();
}
