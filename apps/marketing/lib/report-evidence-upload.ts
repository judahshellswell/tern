import { ref, uploadBytes } from "firebase/storage";
import { getClientStorage } from "./firebase-client";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 3;

export function validateReportEvidence(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return "File is too large — please upload something under 10MB.";
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please upload a JPG, PNG, or WebP image.";
  }
  return null;
}

/**
 * Uploads up to 3 evidence images for a report to Storage and returns
 * their paths, to be stored on the report doc's evidenceImagePaths.
 * Keyed by the reporter's own uid (not the reported user's) and a
 * pre-reserved reportId, so paths are stable before the report document
 * itself is written.
 */
export async function uploadReportEvidence(
  uid: string,
  reportId: string,
  files: File[],
): Promise<string[]> {
  const capped = files.slice(0, MAX_FILES);
  const paths = capped.map((file, i) => {
    const extension = file.name.split(".").pop() ?? "bin";
    return `report-evidence/${uid}/${reportId}-${i}.${extension}`;
  });
  await Promise.all(
    capped.map((file, i) => {
      const storageRef = ref(getClientStorage(), paths[i]);
      return uploadBytes(storageRef, file, { contentType: file.type });
    }),
  );
  return paths;
}
