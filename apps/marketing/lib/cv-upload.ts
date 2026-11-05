import { deleteObject, getDownloadURL, getMetadata, ref, uploadBytes } from "firebase/storage";
import { getClientStorage } from "./firebase-client";
import { cvStoragePath } from "./cv-path";

export { cvStoragePath };

// One optional CV per job seeker, stored at a fixed path (no Firestore
// field needed — the file's existence is the source of truth). Uploading
// again replaces it. Only the owner and the admin can read it directly;
// employers get a short-lived signed link via getApplicantCvUrl in
// app/account-actions.ts, and only for people who applied to their jobs.

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const CV_ACCEPT =
  "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const ALLOWED_TYPES = CV_ACCEPT.split(",");

export function validateCv(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return "File is too large — please upload something under 5MB.";
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please upload a PDF or Word document.";
  }
  return null;
}

export async function uploadCv(uid: string, file: File): Promise<void> {
  await uploadBytes(ref(getClientStorage(), cvStoragePath(uid)), file, {
    contentType: file.type,
    customMetadata: { originalName: file.name.slice(0, 200) },
  });
}

export type CvInfo = { name: string; url: string; uploadedAt: string };

export async function getCv(uid: string): Promise<CvInfo | null> {
  const storageRef = ref(getClientStorage(), cvStoragePath(uid));
  try {
    const [meta, url] = await Promise.all([getMetadata(storageRef), getDownloadURL(storageRef)]);
    return {
      name: meta.customMetadata?.originalName ?? "CV",
      url,
      uploadedAt: meta.updated,
    };
  } catch (err) {
    if ((err as { code?: string }).code === "storage/object-not-found") return null;
    throw err;
  }
}

export async function deleteCv(uid: string): Promise<void> {
  await deleteObject(ref(getClientStorage(), cvStoragePath(uid)));
}
