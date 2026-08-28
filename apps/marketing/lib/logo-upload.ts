import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getClientStorage } from "./firebase-client";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateLogo(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return "File is too large — please upload something under 10MB.";
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please upload a JPG, PNG, or WebP image.";
  }
  return null;
}

/**
 * Uploads an employer's logo to Storage and returns both the path (stored
 * on their profile) and a public download URL (denormalized onto job docs
 * at post time, so job listings never need an extra Storage read).
 */
export async function uploadEmployerLogo(
  uid: string,
  file: File,
): Promise<{ path: string; url: string }> {
  const extension = file.name.split(".").pop() ?? "bin";
  const path = `employer-logos/${uid}/logo.${extension}`;
  const storageRef = ref(getClientStorage(), path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { path, url };
}
