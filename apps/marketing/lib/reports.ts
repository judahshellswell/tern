import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getClientFirestore } from "./firebase-client";
import type { UserRole } from "./types";

export async function createReport(params: {
  reporterId: string;
  reporterRole: UserRole;
  reportedId: string;
  reportedRole: UserRole;
  reportedName: string;
  reason: string;
}): Promise<void> {
  await addDoc(collection(getClientFirestore(), "reports"), {
    ...params,
    status: "open",
    createdAt: serverTimestamp(),
  });
}
