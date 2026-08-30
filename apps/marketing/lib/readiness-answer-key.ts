// The correct option index for every multiple-choice item in
// READINESS_COURSE (lib/types.ts), keyed by item id. Deliberately kept
// in its own file, separate from the course content that gets rendered
// client-side — this file must never be imported by a "use client"
// file, or the correct answers would be readable straight out of the
// bundled JS in devtools. Only import this from server-only code (the
// readiness-gate/readiness-grading server actions).
export const READINESS_ANSWER_KEY: Record<string, number> = {
  "reliability-2": 1,
  "reliability-3": 2,
  "communication-2": 2,
  "communication-3": 0,
  "mistakes-2": 1,
  "mistakes-3": 2,
  "professionalism-1": 1,
  "professionalism-2": 2,
  "professionalism-4": 2,
  "judgment-1": 2,
  "judgment-2": 1,
  "judgment-4": 1,
};
