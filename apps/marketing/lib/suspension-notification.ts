import { getResend, FROM_ADDRESS } from "./resend";

export async function sendSuspensionNotification({
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
    subject: "Your Tern account is temporarily under review",
    text: [
      `Hi ${name},`,
      ``,
      `Your Tern account has been temporarily suspended while we look into something:`,
      ``,
      `"${reason}"`,
      ``,
      `This is reversible — you'll be able to use your account again once we've finished reviewing it. You can still log in in the meantime to check your account status.`,
      ``,
      `If you believe this is a mistake, write to hello@tern.je.`,
      ``,
      `— The Tern team`,
    ].join("\n"),
  });
}
