import { Resend } from "resend";

let resend: Resend | null = null;

export function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY env var.");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export const FROM_ADDRESS = "Tern <hello@tern.je>";
