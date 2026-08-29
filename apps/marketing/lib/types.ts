export type UserRole = "job_seeker" | "employer";

export type VerificationStatus = "pending" | "approved" | "rejected" | "banned";

// Jersey's 12 parishes — the fixed location vocabulary for jobs and
// profiles alike. Replaces free-text location everywhere.
export const PARISHES = [
  "Grouville",
  "St. Brelade",
  "St. Clement",
  "St. Helier",
  "St. John",
  "St. Lawrence",
  "St. Martin",
  "St. Mary",
  "St. Ouen",
  "St. Peter",
  "St. Saviour",
  "Trinity",
] as const;

export type Parish = (typeof PARISHES)[number];

export type JobSeekerProfile = {
  role: "job_seeker";
  uid: string;
  email: string;
  displayName: string;
  dateOfBirth: string; // ISO date, e.g. "2009-04-12"
  guardianEmail: string | null; // required if under 18 at signup
  location: Parish;
  // Up to 3 job types the seeker is most interested in, set at signup and
  // editable afterward. Used only to boost matching jobs toward the top
  // of /jobs — never a hard filter, so an empty array is a valid state.
  preferredJobTypes?: JobType[];
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
  location: Parish;
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

// How pay/hours are entered. Shared shape between the two — range (two
// numbers), fixed (one number), or negotiable (no numbers, decided later
// outside the platform, e.g. at interview).
export type PayMode = "range" | "fixed" | "negotiable";
export type HoursMode = "range" | "fixed" | "negotiable";

export type Job = {
  id: string;
  employerId: string;
  employerName: string;
  employerLogoUrl: string | null;
  title: string;
  description: string;
  type: JobType;
  location: Parish;
  // Optional/absent on jobs posted before payMode existed — treat as
  // "range" at read time (that's what those docs structurally are).
  payMode?: PayMode;
  // range: the min; fixed: the single figure; negotiable: null.
  payMin?: number | null;
  // range: the max; fixed/negotiable: null.
  payMax?: number | null;
  // hoursMode has no legacy shape to preserve (hours were previously an
  // optional free-text field) — always written going forward, but still
  // optional in the type since jobs posted before this change have none.
  hoursMode?: HoursMode;
  hoursMin?: number | null;
  hoursMax?: number | null;
  closeDate?: string | null; // ISO yyyy-mm-dd, informational only — never auto-closes anything
  // Set once a "closing soon" reminder email has been sent to the
  // employer for this closeDate — prevents the daily cron from resending
  // if it ever runs more than once against the same date. Internal only,
  // never rendered.
  closingReminderSentAt?: string | null;
  skills: string[];
  status: "published" | "closed";
  // Incremented once per public job-detail page load. No dedup/unique
  // visitor logic — intentionally a thin signal, not real analytics.
  // Optional since jobs posted before this field existed have none —
  // read as `job.viewCount ?? 0`.
  viewCount?: number;
  createdAt: string;
};

export type ApplicationStatus =
  | "submitted"
  | "reviewed"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "withdrawn";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "New",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

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
  // Denormalized from the job's own status at apply time, kept in sync
  // when the employer closes/reopens the job. A job seeker's read access
  // to a jobs/{id} doc is gated on status=="published" (or being the
  // owning employer), so a closed job is otherwise invisible to the
  // applicant at the rules level — this lets their own applications list
  // still show "this job has closed" without needing to read the job.
  jobStatus: "published" | "closed";
  // The rest of these are a one-time snapshot of the job taken at apply
  // time (never updated afterward, unlike jobStatus) — same reasoning as
  // jobStatus: a closed job is unreadable to the applicant via jobs/{id},
  // so the seeker's own "view this application" page reads entirely off
  // the application doc rather than the job. Content drifting slightly
  // from the live job after the seeker applied is expected/fine here —
  // this is "what you applied to," not a live mirror.
  employerName: string;
  employerLogoUrl: string | null;
  jobType: JobType;
  location: Parish;
  description: string;
  payMode?: PayMode;
  payMin?: number | null;
  payMax?: number | null;
  hoursMode?: HoursMode;
  hoursMin?: number | null;
  hoursMax?: number | null;
  skills: string[];
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

export type ReportStatus = "open" | "dismissed" | "actioned";

export type Report = {
  id: string;
  reporterId: string;
  reporterRole: UserRole;
  reportedId: string;
  reportedRole: UserRole;
  reportedName: string; // denormalized snapshot for admin display
  reason: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null; // admin email, for an audit trail
};
