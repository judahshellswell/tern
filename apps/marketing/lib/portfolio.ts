import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getClientFirestore } from "./firebase-client";
import type { PortfolioEntry } from "./types";

export async function addPortfolioEntry(
  uid: string,
  entry: { title: string; description: string },
): Promise<void> {
  await addDoc(collection(getClientFirestore(), "users", uid, "portfolioEntries"), {
    title: entry.title,
    description: entry.description,
    createdAt: serverTimestamp(),
  });
}

export async function updatePortfolioEntry(
  uid: string,
  entryId: string,
  entry: { title: string; description: string },
): Promise<void> {
  await updateDoc(doc(getClientFirestore(), "users", uid, "portfolioEntries", entryId), {
    title: entry.title,
    description: entry.description,
  });
}

export async function deletePortfolioEntry(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(getClientFirestore(), "users", uid, "portfolioEntries", entryId));
}

export async function listPortfolioEntries(uid: string): Promise<PortfolioEntry[]> {
  const q = query(
    collection(getClientFirestore(), "users", uid, "portfolioEntries"),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PortfolioEntry);
}
