export type UserRole = "job_seeker" | "employer";

export type VerificationStatus = "pending" | "approved" | "rejected" | "banned";

export type JobSeekerProfile = {
  role: "job_seeker";
  uid: string;
  email: string;
  displayName: string;
  dateOfBirth: string; // ISO date, e.g. "2009-04-12"
  guardianEmail: string | null; // required if under 18 at signup
  location: string;
  idDocumentPath: string; // Storage path, e.g. "verification-ids/{uid}/id.jpg"
  verificationStatus: VerificationStatus;
  rejectionReason?: string; // set by admin when verificationStatus is "rejected" or "banned"
  // Informational only — never gates anything. True immediately for Google
  // sign-in (Google already verifies); for email/password, set once the
  // user's own browser confirms Auth's emailVerified after they click the
  // link Firebase sends at signup.
  emailVerified?: boolean;
  createdAt: string;
};

export type EmployerProfile = {
  role: "employer";
  uid: string;
  email: string;
  businessName: string;
  registrationNumber: string;
  location: string;
  logoPath: string; // Storage path, e.g. "employer-logos/{uid}/logo.jpg"
  isFreeEmailDomain: boolean; // signup email isn't on the business's own domain
  verificationStatus: VerificationStatus;
  rejectionReason?: string; // set by admin when verificationStatus is "rejected" or "banned"
  emailVerified?: boolean;
  createdAt: string;
};

export type UserProfile = JobSeekerProfile | EmployerProfile;

export type PortfolioEntry = {
  id: string;
  title: string; // e.g. "Member of U16 football Jersey team"
  description: string; // short blurb on what it involved / why it matters
  createdAt: string;
};

export type JobType =
  | "part_time"
  | "apprenticeship"
  | "internship"
  | "temporary"
  | "seasonal";

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  part_time: "Part-time",
  apprenticeship: "Apprenticeship",
  internship: "Internship",
  temporary: "Temporary",
  seasonal: "Seasonal",
};

export type PayType = "hourly" | "salary_pro_rata" | "fixed";

// How pay is entered — a separate axis from PayType (hourly/salary/fixed
// is the pay *basis*; this is how the number(s) are given).
export type PayMode = "range" | "fixed" | "negotiable";

export type Job = {
  id: string;
  employerId: string;
  employerName: string;
  employerLogoUrl: string | null;
  title: string;
  description: string;
  type: JobType;
  location: string;
  payType: PayType;
  // Optional/absent on jobs posted before payMode existed — treat as
  // "range" at read time (that's what those docs structurally are).
  payMode?: PayMode;
  // range: the min; fixed: the single figure; negotiable: null.
  payMin?: number | null;
  // range: the max; fixed/negotiable: null.
  payMax?: number | null;
  hoursPerWeek?: string | null; // free text, e.g. "16-20"
  closeDate?: string | null; // ISO yyyy-mm-dd, informational only — never auto-closes anything
  skills: string[];
  status: "published" | "closed";
  createdAt: string;
};

export type ApplicationStatus =
  | "submitted"
  | "reviewed"
  | "shortlisted"
  | "rejected"
  | "hired";

export type Application = {
  id: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  applicantId: string;
  applicantName: string;
  // Denormalized from the applicant's own verificationStatus and kept in
  // sync when they're banned. Firestore list-query rules can only be
  // proven safe using fields the query itself filters on — the employer's
  // applicants query filters on this directly — so this can't be a live
  // get() against the applicant's profile the way a single-document read
  // could.
  applicantBanned: boolean;
  coverNote: string;
  status: ApplicationStatus;
  createdAt: string;
};

function isUnderAge(dateOfBirth: string, age: number): boolean {
  const dob = new Date(dateOfBirth);
  const nthBirthday = new Date(dob.getFullYear() + age, dob.getMonth(), dob.getDate());
  return Date.now() < nthBirthday.getTime();
}

export function isUnder18(dateOfBirth: string): boolean {
  return isUnderAge(dateOfBirth, 18);
}

export const MINIMUM_AGE = 16;

export function isUnderMinimumAge(dateOfBirth: string): boolean {
  return isUnderAge(dateOfBirth, MINIMUM_AGE);
}

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "live.co.uk",
  "icloud.com",
  "me.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "gmx.com",
  "gmx.co.uk",
]);

export function isFreeEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return !!domain && FREE_EMAIL_DOMAINS.has(domain);
}
