import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getClientFirestore } from "./firebase-client";
import { isFreeEmailDomain, isUnder18, type UserProfile } from "./types";

export type JobSeekerSignupDetails = {
  displayName: string;
  dateOfBirth: string;
  guardianEmail: string;
  location: string;
  idDocumentPath: string;
};

export type EmployerSignupDetails = {
  businessName: string;
  registrationNumber: string;
  location: string;
  logoPath: string;
};

export async function createJobSeekerProfile(
  uid: string,
  email: string,
  details: JobSeekerSignupDetails,
  emailVerified: boolean,
): Promise<void> {
  const under18 = isUnder18(details.dateOfBirth);
  const ref = doc(getClientFirestore(), "users", uid);
  await setDoc(ref, {
    role: "job_seeker",
    uid,
    email,
    displayName: details.displayName,
    dateOfBirth: details.dateOfBirth,
    guardianEmail: under18 ? details.guardianEmail : null,
    location: details.location,
    idDocumentPath: details.idDocumentPath,
    verificationStatus: "pending",
    emailVerified,
    createdAt: serverTimestamp(),
  });
}

export async function createEmployerProfile(
  uid: string,
  email: string,
  details: EmployerSignupDetails,
  emailVerified: boolean,
): Promise<void> {
  const ref = doc(getClientFirestore(), "users", uid);
  await setDoc(ref, {
    role: "employer",
    uid,
    email,
    businessName: details.businessName,
    registrationNumber: details.registrationNumber,
    location: details.location,
    logoPath: details.logoPath,
    isFreeEmailDomain: isFreeEmailDomain(email),
    verificationStatus: "pending",
    emailVerified,
    createdAt: serverTimestamp(),
  });
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(getClientFirestore(), "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// Lightweight edit path for an already-approved user fixing their own
// details — a real updateDoc touching only content fields, never
// verificationStatus. Deliberately separate from
// createJobSeekerProfile/createEmployerProfile above, which setDoc a
// full document (including verificationStatus: "pending") as part of
// signup/reapply — reusing those here would silently reset an approved
// account back to pending on every edit, which is exactly what this is
// meant to avoid.
export async function updateJobSeekerDetails(
  uid: string,
  details: { displayName: string; location: string },
): Promise<void> {
  await updateDoc(doc(getClientFirestore(), "users", uid), {
    displayName: details.displayName,
    location: details.location,
  });
}

export async function updateEmployerDetails(
  uid: string,
  details: {
    businessName: string;
    registrationNumber: string;
    location: string;
    logoPath?: string;
  },
): Promise<void> {
  await updateDoc(doc(getClientFirestore(), "users", uid), {
    businessName: details.businessName,
    registrationNumber: details.registrationNumber,
    location: details.location,
    ...(details.logoPath ? { logoPath: details.logoPath } : {}),
  });
}
