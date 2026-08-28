import { getResend, FROM_ADDRESS } from "./resend";

export async function notifyEmployerOfApplication({
  employerEmail,
  employerName,
  applicantName,
  jobId,
  jobTitle,
  coverNote,
}: {
  employerEmail: string;
  employerName: string;
  applicantName: string;
  jobId: string;
  jobTitle: string;
  coverNote: string;
}): Promise<void> {
  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: employerEmail,
    subject: `New application: ${jobTitle}`,
    text: [
      `Hi ${employerName},`,
      ``,
      `${applicantName} just applied to "${jobTitle}" on Tern.`,
      ...(coverNote ? [``, `"${coverNote}"`] : []),
      ``,
      `View it: https://www.tern.je/employer/jobs/${jobId}`,
      ``,
      `— The Tern team`,
    ].join("\n"),
  });
}
