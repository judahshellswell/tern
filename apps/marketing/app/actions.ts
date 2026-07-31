"use server";

import { addToWaitlist, type WaitlistRole } from "@/lib/waitlist";

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
