import { getResend, FROM_ADDRESS } from "./resend";

export async function sendRejectionNotification({
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
    subject: "An update on your Tern verification",
    text: [
      `Hi ${name},`,
      ``,
      `We weren't able to verify your Tern account this time:`,
      ``,
      `"${reason}"`,
      ``,
      `If you'd like to sort this out, reply to this email or write to hello@tern.je and we'll help you get verified.`,
      ``,
      `— The Tern team`,
    ].join("\n"),
  });
}
