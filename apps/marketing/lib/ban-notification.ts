import { getResend, FROM_ADDRESS } from "./resend";

export async function sendBanNotification({
  userEmail,
  name,
  reason,
}: {
  userEmail: string;
  name: string;
  reason: string;
}): Promise<void> {
  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: userEmail,
    subject: "Your Tern account has been suspended",
    text: [
      `Hi ${name},`,
      ``,
      `Your Tern account has been suspended:`,
      ``,
      `"${reason}"`,
      ``,
      `You won't be able to log in or create a new account with this email going forward.`,
      ``,
      `If you believe this is a mistake, write to hello@tern.je.`,
      ``,
      `— The Tern team`,
    ].join("\n"),
  });
}
