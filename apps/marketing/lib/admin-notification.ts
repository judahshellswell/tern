import { getResend, FROM_ADDRESS } from "./resend";
import { ADMIN_EMAILS } from "./admin";

export async function notifyAdminOfPendingVerification({
  role,
  name,
  email,
}: {
  role: "job_seeker" | "employer";
  name: string;
  email: string;
}): Promise<void> {
  const roleLabel = role === "job_seeker" ? "Job seeker" : "Employer";

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAILS,
    subject: `New ${roleLabel.toLowerCase()} to verify: ${name}`,
    text: [
      `${roleLabel} "${name}" (${email}) just signed up and is waiting for verification.`,
      ``,
      `Review it: https://www.tern.je/admin`,
    ].join("\n"),
  });
}
