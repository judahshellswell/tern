export const ADMIN_EMAILS = ["info@judapps.co.uk"];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}

// Accounts handed to an external company (Co-op) to click through the
// product themselves — self-deleting one of these would permanently
// wipe the demo (job listing, applications, chat history) with no way
// to hand the same walkthrough to anyone else afterward. Protected the
// same way the admin account is, via deleteMyAccount in
// app/account-actions.ts.
export const DEMO_EMAILS = ["demo-coop@tern.je", "demo-candidate@tern.je"];

export function isDemoEmail(email: string | null | undefined): boolean {
  return !!email && DEMO_EMAILS.includes(email);
}
