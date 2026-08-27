import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
  type UserCredential,
} from "firebase/auth";
import { getClientAuth, googleAuthProvider } from "./firebase-client";

export function signUpWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(getClientAuth(), email, password);
}

export function logInWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(getClientAuth(), email, password);
}

export function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(getClientAuth(), googleAuthProvider);
}

export function logOut(): Promise<void> {
  return signOut(getClientAuth());
}

export function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(getClientAuth(), email);
}

// Confirms the address is real and can receive mail — purely informational
// (shown to the admin in /admin), never gates signup, applying, or posting.
// Google accounts are always already verified by Google, so this only
// matters for the email/password path.
export function sendVerificationEmail(user: User): Promise<void> {
  return sendEmailVerification(user);
}

const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/too-many-requests": "Too many attempts — please wait a moment and try again.",
};

export function authErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const code = (error as { code: string }).code;
    return ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
