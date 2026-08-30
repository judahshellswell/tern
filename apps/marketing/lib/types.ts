export type UserRole = "job_seeker" | "employer";

export type VerificationStatus = "pending" | "approved" | "rejected" | "banned" | "suspended";

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
  rejectionReason?: string; // set by admin when verificationStatus is "rejected", "banned", or "suspended"
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
  rejectionReason?: string; // set by admin when verificationStatus is "rejected", "banned", or "suspended"
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
  // Parallel to applicantBanned but independently reversible — set when
  // the applicant's account is suspended (not banned) and cleared again
  // if the suspension is lifted. Kept as a separate field rather than
  // reusing applicantBanned since ban is permanent and suspend isn't.
  applicantSuspended?: boolean;
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
  evidenceImagePaths?: string[]; // Storage paths, e.g. "report-evidence/{reporterId}/{reportId}-0.jpg"; max 3
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null; // admin email, for an audit trail
};

export type NotificationKind =
  | "account_banned"
  | "account_suspended"
  | "signup_rejected"
  | "new_application"
  | "application_status_changed"
  | "job_closing_soon"
  | "admin_signup_pending"
  | "admin_report_filed"
  | "readiness_gate_passed"
  | "readiness_gate_flagged"
  | "readiness_gate_rejected"
  | "admin_readiness_review_pending";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string; // in-app relative path, e.g. "/employer/jobs/abc123"
  read: boolean;
  createdAt: string;
};

// One-time gate between admin approval and a job seeker's first
// application — a ~30 minute course of free-text and multiple-choice
// questions, grouped into sections. Free-text answers are graded by
// Claude (see lib/readiness-grading.ts); multiple-choice answers are
// scored deterministically against lib/readiness-answer-key.ts (kept
// out of any client bundle so the correct answers are never
// discoverable via devtools). Meant to catch obviously disengaged
// submissions, not to be a bar for eloquence or perfect recall.
export type ReadinessItemType = "free_text" | "multiple_choice";
// Future: | "video" — this union is designed so a new item type is
// additive (new member + new renderer branch), never a breaking change
// to existing content or submitted data.

export type ReadinessFreeTextItem = {
  type: "free_text";
  id: string; // stable key, e.g. "reliability-1" — joins answers back to content across edits
  prompt: string;
};

export type ReadinessMultipleChoiceItem = {
  type: "multiple_choice";
  id: string;
  prompt: string;
  options: string[]; // rendered in array order; correct answer lives only in readiness-answer-key.ts
};

export type ReadinessItem = ReadinessFreeTextItem | ReadinessMultipleChoiceItem;

export type ReadinessSection = {
  id: string;
  title: string;
  items: ReadinessItem[];
};

// The hardcoded course content, client-safe (no correct answers here —
// see lib/readiness-answer-key.ts, which is never imported by a "use
// client" file).
export const READINESS_COURSE: ReadinessSection[] = [
  {
    id: "reliability",
    title: "Reliability",
    items: [
      {
        type: "free_text",
        id: "reliability-1",
        prompt:
          "You're scheduled for a shift tomorrow, but something's come up and you don't think you can make it. What do you do?",
      },
      {
        type: "multiple_choice",
        id: "reliability-2",
        prompt: "If you're going to be late for a shift, the best thing to do is:",
        options: [
          "Text a friend who also works there and ask them to pass it on",
          "Contact your manager directly, as early as possible",
          "Just arrive as soon as you can and explain when you get there",
          "Wait and see if anyone notices",
        ],
      },
      {
        type: "multiple_choice",
        id: "reliability-3",
        prompt: "How much notice should you try to give if you need to cancel a shift?",
        options: [
          "None — it's fine to cancel last minute if something comes up",
          "A few hours' notice is always enough",
          "As much notice as possible, ideally as soon as you know",
          "It doesn't matter as long as you show up next time",
        ],
      },
      {
        type: "free_text",
        id: "reliability-4",
        prompt:
          "Why do you think showing up on time and doing what you said you'd do matters, even for a part-time or casual job?",
      },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    items: [
      {
        type: "free_text",
        id: "communication-1",
        prompt:
          "Your manager asks you to do a task at work, but you don't understand exactly what they want. How do you handle it?",
      },
      {
        type: "multiple_choice",
        id: "communication-2",
        prompt: "If a customer asks you a question you don't know the answer to, the best response is:",
        options: [
          "Guess, so you don't look unhelpful",
          "Tell them you don't know and walk away",
          "Say you're not sure, then find someone who can help or find out",
          "Ignore the question and move on to the next customer",
        ],
      },
      {
        type: "multiple_choice",
        id: "communication-3",
        prompt: "A coworker is clearly annoyed with you but hasn't said why. What's the best first step?",
        options: [
          "Ask them directly, calmly, if everything's okay",
          "Avoid them until it blows over",
          "Complain about them to another coworker",
          "Assume it's not your problem and ignore it",
        ],
      },
      {
        type: "free_text",
        id: "communication-4",
        prompt:
          "Describe a time (at work, school, or anywhere) you had to tell someone something they didn't want to hear. How did you handle it?",
      },
    ],
  },
  {
    id: "mistakes",
    title: "Handling mistakes",
    items: [
      {
        type: "free_text",
        id: "mistakes-1",
        prompt:
          "You make a mistake at work — maybe you're late, or you get something wrong in front of a customer. What happens next, from you?",
      },
      {
        type: "multiple_choice",
        id: "mistakes-2",
        prompt:
          "You realise you've made a mistake that a customer hasn't noticed yet but will affect their order/experience. What should you do?",
        options: [
          "Say nothing, since they haven't noticed",
          "Tell someone straight away so it can be fixed",
          "Wait and see if it becomes a problem first",
          "Fix it quietly yourself without telling anyone, even if you're not sure how",
        ],
      },
      {
        type: "multiple_choice",
        id: "mistakes-3",
        prompt: "Your manager points out a mistake you made. The best response is:",
        options: [
          "Explain all the reasons it wasn't really your fault",
          "Get defensive — nobody likes being corrected",
          "Acknowledge it, and ask what you should do differently next time",
          "Say nothing and hope it isn't mentioned again",
        ],
      },
      {
        type: "free_text",
        id: "mistakes-4",
        prompt:
          "Everyone messes up sometimes. What matters more to you — never making a mistake, or how you deal with one when it happens? Why?",
      },
    ],
  },
  {
    id: "professionalism",
    title: "Professionalism & attitude",
    items: [
      {
        type: "multiple_choice",
        id: "professionalism-1",
        prompt: "You're having a bad day before your shift starts. The best approach is:",
        options: [
          "Let your mood show — people should understand",
          "Try to leave it at the door and stay professional during the shift",
          "Tell every customer about it so they know why you seem off",
          "Call in sick even though you're not actually ill",
        ],
      },
      {
        type: "multiple_choice",
        id: "professionalism-2",
        prompt: "Which of these is the best sign someone is a reliable coworker?",
        options: [
          "They're the loudest, most talkative person on shift",
          "They always know more than everyone else",
          "You can count on them to do what they say, even when no one's watching",
          "They never ask questions",
        ],
      },
      {
        type: "free_text",
        id: "professionalism-3",
        prompt:
          "What does \"bringing real value\" to a job mean to you, beyond just turning up and doing the minimum required?",
      },
      {
        type: "multiple_choice",
        id: "professionalism-4",
        prompt: "If you disagree with a decision your manager makes, the best approach is usually to:",
        options: [
          "Do it your own way anyway, without saying anything",
          "Complain to coworkers instead of raising it",
          "Raise your concern respectfully, then follow the decision once it's made",
          "Refuse until they change their mind",
        ],
      },
    ],
  },
  {
    id: "judgment",
    title: "Customer & workplace judgment",
    items: [
      {
        type: "multiple_choice",
        id: "judgment-1",
        prompt: "A customer is rude to you for something that isn't your fault. The best response is:",
        options: [
          "Match their tone — they started it",
          "Ignore them completely",
          "Stay calm and professional, and get a manager involved if it escalates",
          "Argue back until they apologise",
        ],
      },
      {
        type: "multiple_choice",
        id: "judgment-2",
        prompt: "You finish your tasks early during a shift with time to spare. What should you do?",
        options: [
          "Take an unscheduled break since your work is done",
          "Ask your manager or a coworker if there's anything else that needs doing",
          "Wait quietly until your shift ends",
          "Leave early since there's nothing left to do",
        ],
      },
      {
        type: "free_text",
        id: "judgment-3",
        prompt: "Describe what \"good customer service\" looks like to you, in your own words.",
      },
      {
        type: "multiple_choice",
        id: "judgment-4",
        prompt: "If you see a coworker struggling to keep up during a busy shift, the best thing to do is:",
        options: [
          "Focus on your own tasks — it's not your job to help",
          "Offer to help if you're able to",
          "Mention it to a manager as a complaint about them",
          "Ignore it, they'll figure it out",
        ],
      },
    ],
  },
];

// More than this many multiple-choice answers wrong (across the whole
// course) routes the submission to admin review, independent of the AI
// verdict on the free-text answers — a couple of misclicks or debatable
// answers shouldn't flag someone on their own, but a pattern of wrong
// answers is worth a human look.
export const READINESS_MC_MAX_WRONG = 2;

export type ReadinessGateOutcome = "passed" | "flagged" | "rejected";

// Chosen by the admin when rejecting a submission — how long before the
// seeker can retake the course. "none" matches the original no-cooldown
// behavior (retake immediately). "permanent" is scoped to the readiness
// course only — the account itself is untouched, unlike a ban.
export type ReadinessRetakeDelay = "none" | "24h" | "72h" | "1w" | "permanent";

export const READINESS_RETAKE_DELAY_LABELS: Record<ReadinessRetakeDelay, string> = {
  none: "None — can retake immediately",
  "24h": "24 hours",
  "72h": "72 hours",
  "1w": "One week",
  permanent: "Permanent",
};

const READINESS_RETAKE_DELAY_MS: Record<Exclude<ReadinessRetakeDelay, "none" | "permanent">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "72h": 72 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

// Resolves a chosen delay (as of `from`) to the submission fields that
// encode it — kept here, not just in the admin UI, so the same rule
// (what "permanent" means, what "none" means) governs both the write
// path (readiness-gate.ts) and any future read of these fields.
export function resolveReadinessRetakeLock(
  delay: ReadinessRetakeDelay,
  from: Date,
): { retryLockedUntil: string | null; retryLockedPermanently: boolean } {
  if (delay === "permanent") return { retryLockedUntil: null, retryLockedPermanently: true };
  if (delay === "none") return { retryLockedUntil: null, retryLockedPermanently: false };
  return {
    retryLockedUntil: new Date(from.getTime() + READINESS_RETAKE_DELAY_MS[delay]).toISOString(),
    retryLockedPermanently: false,
  };
}

export type ReadinessItemAnswer = {
  itemId: string;
  prompt: string; // snapshot of the question text at submission time
  type: ReadinessItemType;
  // free_text:
  answer?: string;
  // multiple_choice:
  selectedIndex?: number;
  correct?: boolean; // computed at grading time, deterministic
};

export type ReadinessSectionResult = {
  sectionId: string;
  sectionTitle: string; // snapshot
  answers: ReadinessItemAnswer[];
};

// Lives at the single fixed path users/{uid}/readinessGate/submission —
// written only by the submitReadinessGate/reviewReadinessGate server
// actions (app/actions.ts), never directly by the client. A predictable
// single-doc path is what lets both the apply-gate check and the
// Firestore rule read "has this user passed" with one get(), since
// rules can't run queries.
export type ReadinessGateSubmission = {
  sections: ReadinessSectionResult[];
  mcCorrectCount: number;
  mcTotalCount: number;
  aiVerdict: "pass" | "flag"; // AI verdict on the free-text answers only
  aiReasoning: string;
  outcome: ReadinessGateOutcome;
  adminReviewedBy?: string; // admin email, set only when outcome is set by an admin
  adminReason?: string; // required when outcome is set to "rejected"
  adminReviewedAt?: string | null;
  // Set only on rejection, from the admin's chosen ReadinessRetakeDelay.
  // retryLockedUntil is an ISO timestamp the seeker must wait past to
  // resubmit; retryLockedPermanently means never (readiness course
  // only — the account itself is unaffected). Both absent/false for a
  // "none" delay, matching the original no-cooldown behavior.
  retryLockedUntil?: string | null;
  retryLockedPermanently?: boolean;
  createdAt: string;
  updatedAt: string;
};
