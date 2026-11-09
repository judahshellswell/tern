// Temporary pre-launch gate. While true, the site's account-creation and
// account-access entry points (/sign-up, /log-in, /forgot-password) all
// redirect to /coming-soon instead of collecting any personal data — the
// platform otherwise stays fully browsable (jobs, about, etc.), since
// browsing alone never touches personal data. Every other
// personal-data surface (dashboard, employer tools, applying to jobs) is
// already reachable only by a signed-in user, so blocking these three
// pages is sufficient to block all of them with nobody able to sign up
// or log in at all.
//
// To go live on launch day: flip this to false (or delete it and the
// three redirects in app/sign-up, app/log-in, app/forgot-password — see
// each page.tsx for the single `if` block to remove).
export const LAUNCH_GATE_ACTIVE = true;

export const LAUNCH_DATE_LABEL = "1 January 2027";
