import { getAnthropic, READINESS_GATE_MODEL } from "./anthropic";

export type GradingResult = { verdict: "pass" | "flag"; reasoning: string };

export type FreeTextAnswer = { prompt: string; answer: string };

const SYSTEM_PROMPT = `You are screening written answers from a young job seeker (age 16+) applying for part-time, seasonal, or entry-level work in Jersey. They were asked a set of short scenario questions across several topics — reliability, communication, handling mistakes, professionalism, and customer/workplace judgment.

Your job is to decide PASS or FLAG for the submission as a whole:
- PASS: the answers show genuine, specific, thoughtful engagement — even if brief, informal, or imperfectly written. Short but concrete, sincere answers should PASS. Do not penalize informal tone, spelling, or grammar. A few weaker answers among mostly solid ones should still PASS.
- FLAG: the answers are, as a pattern, low-effort placeholders (e.g. "idk", "I would do it", single words, copy-pasted or repeated text across answers, answers that don't address the question at all, or answers that suggest genuinely poor judgement — e.g. "I'd just not show up and not tell anyone"). A single weak or joke answer among otherwise genuine ones can still warrant a FLAG if it reads as a deliberate refusal to engage, but isolated brevity or nervousness should not.

Default to PASS when in doubt. This is a filter for obviously disengaged submissions, not a bar for eloquence.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{"verdict": "pass" | "flag", "reasoning": "one or two sentences explaining the decision"}`;

function buildUserPrompt(answers: readonly FreeTextAnswer[]): string {
  return answers.map((a, i) => `Q${i + 1}: ${a.prompt}\nA${i + 1}: ${a.answer}`).join("\n\n");
}

export async function gradeReadinessGateSubmission(answers: readonly FreeTextAnswer[]): Promise<GradingResult> {
  const response = await getAnthropic().messages.create({
    model: READINESS_GATE_MODEL,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(answers) }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("Anthropic response contained no text block.");
  }

  // Defensive parse — strip any accidental markdown fencing, then JSON.parse.
  const raw = textBlock.text
    .trim()
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Anthropic response was not valid JSON: ${raw.slice(0, 200)}`);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("verdict" in parsed) ||
    !("reasoning" in parsed) ||
    (parsed.verdict !== "pass" && parsed.verdict !== "flag") ||
    typeof parsed.reasoning !== "string"
  ) {
    throw new Error(`Anthropic response had unexpected shape: ${raw.slice(0, 200)}`);
  }

  return { verdict: parsed.verdict, reasoning: parsed.reasoning };
}
