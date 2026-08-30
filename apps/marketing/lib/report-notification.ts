import { getResend, FROM_ADDRESS } from "./resend";
import { ADMIN_EMAILS } from "./admin";
import type { UserRole } from "./types";

export async function notifyAdminOfReport({
  reportId,
  reporterRole,
  reportedName,
  reportedRole,
  reason,
}: {
  reportId: string;
  reporterRole: UserRole;
  reportedName: string;
  reportedRole: UserRole;
  reason: string;
}): Promise<void> {
  const reporterLabel = reporterRole === "job_seeker" ? "job seeker" : "employer";
  const reportedLabel = reportedRole === "job_seeker" ? "job seeker" : "employer";

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAILS,
    subject: `New report: ${reportedName}`,
    text: [
      `A ${reporterLabel} reported ${reportedLabel} "${reportedName}":`,
      ``,
      `"${reason}"`,
      ``,
      `Review it: https://www.tern.je/admin/reports/${reportId}`,
    ].join("\n"),
  });
}
