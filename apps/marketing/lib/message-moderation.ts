// Reactive, not proactive: Jersey's minimum age for Tern (16) means
// strong real-time monitoring isn't a legal requirement the way it
// would be for a platform open to under-16s. This is a blunt tripwire
// for language with no plausible recruitment relevance, not a content
// filter — a match never blocks the send, it only flags the message
// for the admin's flagged-messages queue (see components/admin/
// flagged-messages-queue.tsx), same "never silently block, always
// surface for a human" convention as readiness-gate grading failures.
// Deliberately simple (substring match, no AI call) — see the research
// note on why a per-message Claude call isn't the right fit here: it
// would add real latency/cost to every message send for a check this
// cheap to do synchronously instead.
const FLAGGED_KEYWORDS = [
  // Sexual content / solicitation
  "nude", "nudes", "sexting", "onlyfans", "hookup", "fuck me", "blowjob",
  "porn", "sex pic", "send pics",
  // Drugs
  "weed", "cocaine", "mdma", "ecstasy pills", "drug deal",
  // Off-platform personal contact solicitation (recruitment should stay
  // on-platform until an interview/offer is agreed through the proper flow).
  // Matched on topic, not exact phrasing — "what's your snapchat?" and
  // "what's your number?" need to flag just as much as "snapchat me".
  "whatsapp", "snapchat", "snap chat", "your number", "phone number",
  "my number", "personal number", "your insta", "instagram", "add me on",
  "my snap", "ur snap", "ur number", "text me", "call me", "imessage",
  "telegram", "discord",
  // Slurs / harassment — kept short and generic deliberately; this list
  // is a tripwire, not an exhaustive hate-speech classifier.
  "kill yourself", "kys",
] as const;

export function moderateMessage(body: string): { flagged: boolean } {
  const normalized = body.toLowerCase();
  const flagged = FLAGGED_KEYWORDS.some((keyword) => normalized.includes(keyword));
  return { flagged };
}
