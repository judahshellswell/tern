export const ADMIN_EMAILS = ["info@judapps.co.uk"];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}
