import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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
};

export async function createJobSeekerProfile(
  uid: string,
  email: string,
  details: JobSeekerSignupDetails,
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
    createdAt: serverTimestamp(),
  });
}

export async function createEmployerProfile(
  uid: string,
  email: string,
  details: EmployerSignupDetails,
): Promise<void> {
  const ref = doc(getClientFirestore(), "users", uid);
  await setDoc(ref, {
    role: "employer",
    uid,
    email,
    businessName: details.businessName,
    registrationNumber: details.registrationNumber,
    location: details.location,
    isFreeEmailDomain: isFreeEmailDomain(email),
    verificationStatus: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(getClientFirestore(), "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
