export type UserRole = "job_seeker" | "employer";

export type VerificationStatus = "pending" | "approved" | "rejected";

export type JobSeekerProfile = {
  role: "job_seeker";
  uid: string;
  email: string;
  displayName: string;
  dateOfBirth: string; // ISO date, e.g. "2009-04-12"
  guardianEmail: string | null; // required if under 18 at signup
  location: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
};

export type EmployerProfile = {
  role: "employer";
  uid: string;
  email: string;
  businessName: string;
  registrationNumber: string;
  location: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
};

export type UserProfile = JobSeekerProfile | EmployerProfile;

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

export type Job = {
  id: string;
  employerId: string;
  employerName: string;
  title: string;
  description: string;
  type: JobType;
  location: string;
  payType: PayType;
  payMin: number;
  payMax: number;
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
  coverNote: string;
  status: ApplicationStatus;
  createdAt: string;
};

export function isUnder18(dateOfBirth: string): boolean {
  const dob = new Date(dateOfBirth);
  const eighteenthBirthday = new Date(
    dob.getFullYear() + 18,
    dob.getMonth(),
    dob.getDate(),
  );
  return Date.now() < eighteenthBirthday.getTime();
}
