import { getResend, FROM_ADDRESS } from "./resend";

export async function sendGuardianNotification({
  guardianEmail,
  jobSeekerName,
}: {
  guardianEmail: string;
  jobSeekerName: string;
}): Promise<void> {
  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: guardianEmail,
    subject: `${jobSeekerName} has joined Tern`,
    text: [
      `Hi,`,
      ``,
      `${jobSeekerName} has created an account on Tern (tern.je), a job platform for part-time and entry-level work in Jersey. You're receiving this because they're under 18 and listed you as their parent or guardian.`,
      ``,
      `In Jersey, 16 and 17 year olds are treated as adults for employment purposes, so this is a notification rather than something we need you to act on. If you have any questions or concerns about their account, reply to this email or write to hello@tern.je and we'll help.`,
      ``,
      `What Tern does:`,
      `- Every account is reviewed before it can apply to or post jobs`,
      `- There's no open messaging between candidates and employers — only structured templates like interview invites`,
      `- Employers only ever see people who applied to their own job listings, never a searchable list of candidates`,
      ``,
      `— The Tern team`,
    ].join("\n"),
  });
}
