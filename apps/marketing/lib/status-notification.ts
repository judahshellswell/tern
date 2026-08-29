import { getResend, FROM_ADDRESS } from "./resend";
import type { ApplicationStatus } from "./types";

// "withdrawn" is set by the applicant on themself, never something the
// employer selects — no employer-driven email makes sense for it.
type NotifiableStatus = Exclude<ApplicationStatus, "submitted" | "withdrawn">;

const MESSAGE_FOR: Record<NotifiableStatus, { subject: (jobTitle: string) => string; line: string }> = {
  reviewed: {
    subject: (jobTitle) => `Your application for ${jobTitle} has been reviewed`,
    line: "the employer has reviewed your application.",
  },
  shortlisted: {
    subject: (jobTitle) => `You've been shortlisted for ${jobTitle}`,
    line: "you've been shortlisted — the employer may be in touch soon.",
  },
  rejected: {
    subject: (jobTitle) => `Update on your application for ${jobTitle}`,
    line: "the employer has decided not to move forward with your application at this time.",
  },
  hired: {
    subject: (jobTitle) => `Congratulations — you've been hired for ${jobTitle}`,
    line: "the employer has hired you. Congratulations!",
  },
};

export async function sendStatusChangeNotification(
  applicantEmail: string,
  applicantName: string,
  jobTitle: string,
  status: NotifiableStatus,
): Promise<void> {
  const { subject, line } = MESSAGE_FOR[status];
  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: applicantEmail,
    subject: subject(jobTitle),
    text: [
      `Hi ${applicantName},`,
      ``,
      `An update on your application for "${jobTitle}" — ${line}`,
      ``,
      `— The Tern team`,
    ].join("\n"),
  });
}
