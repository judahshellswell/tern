import { getResend, FROM_ADDRESS } from "./resend";

export async function sendClosingSoonReminder({
  employerEmail,
  employerName,
  jobId,
  jobTitle,
  closeDate,
}: {
  employerEmail: string;
  employerName: string;
  jobId: string;
  jobTitle: string;
  closeDate: string;
}): Promise<void> {
  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: employerEmail,
    subject: `"${jobTitle}" closes soon`,
    text: [
      `Hi ${employerName},`,
      ``,
      `Your job "${jobTitle}" is set to close on ${closeDate}.`,
      `If you'd like to keep it open for longer, you can update the closing date, or leave it as is and it'll simply stop showing a date once it passes — the listing itself stays live either way.`,
      ``,
      `Review it: https://www.tern.je/employer/jobs/${jobId}`,
      ``,
      `— The Tern team`,
    ].join("\n"),
  });
}
