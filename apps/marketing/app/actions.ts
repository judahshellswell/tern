"use server";

import { addToWaitlist, type WaitlistRole } from "@/lib/waitlist";
import { sendGuardianNotification } from "@/lib/guardian-notification";
import { notifyAdminOfPendingVerification } from "@/lib/admin-notification";

export type WaitlistFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function joinWaitlist(
  _prevState: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  const email = String(formData.get("email") ?? "");
  const role = formData.get("role") === "employer" ? "employer" : "job_seeker";

  const result = await addToWaitlist(email, role as WaitlistRole);

  if (!result.ok) {
    if (result.reason === "already_registered") {
      return {
        status: "success",
        message: "You're already on the list — we'll be in touch.",
      };
    }
    return {
      status: "error",
      message: "That doesn't look like a valid email address.",
    };
  }

  return {
    status: "success",
    message:
      role === "employer"
        ? "You're on the list. We'll email you as soon as employer verification opens in Jersey."
        : "You're on the list. We'll email you the moment Tern opens in Jersey.",
  };
}

// Called right after a job seeker profile is created, if they're under 18.
// Failure here shouldn't block account creation — the account already
// exists in Firestore by the time this runs — so callers should treat
// this as best-effort and not surface a hard error to the user.
export async function notifyGuardian(guardianEmail: string, jobSeekerName: string) {
  try {
    await sendGuardianNotification({ guardianEmail, jobSeekerName });
    return { ok: true } as const;
  } catch (err) {
    console.error("Failed to send guardian notification:", err);
    return { ok: false } as const;
  }
}

// Called right after any job seeker or employer profile is created, so the
// admin doesn't have to poll /admin to know something is waiting. Same
// best-effort contract as notifyGuardian — never blocks account creation.
export async function notifyAdminOfSignup(
  role: "job_seeker" | "employer",
  name: string,
  email: string,
) {
  try {
    await notifyAdminOfPendingVerification({ role, name, email });
    return { ok: true } as const;
  } catch (err) {
    console.error("Failed to send admin verification notification:", err);
    return { ok: false } as const;
  }
}
