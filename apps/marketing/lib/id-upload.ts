import { ref, uploadBytes } from "firebase/storage";
import { getClientStorage } from "./firebase-client";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function validateIdDocument(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return "File is too large — please upload something under 10MB.";
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please upload a JPG, PNG, WebP, or PDF file.";
  }
  return null;
}

/**
 * Uploads a job seeker's ID document to Storage and returns the path to
 * store on their profile. Storage rules require the caller to already be
 * authenticated as `uid` — this must run after sign-up, before (or as
 * part of) profile creation.
 */
export async function uploadIdDocument(uid: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop() ?? "bin";
  const path = `verification-ids/${uid}/id.${extension}`;
  const storageRef = ref(getClientStorage(), path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return path;
}
