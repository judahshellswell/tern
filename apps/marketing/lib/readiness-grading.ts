import { getAnthropic, READINESS_GATE_MODEL } from "./anthropic";
import { READINESS_GATE_QUESTIONS } from "./types";

export type GradingResult = { verdict: "pass" | "flag"; reasoning: string };

const SYSTEM_PROMPT = `You are screening written answers from a young job seeker (age 16+) applying for part-time, seasonal, or entry-level work in Jersey. They were asked 3 short scenario questions about work reliability, communication, and handling mistakes.

Your job is to decide PASS or FLAG:
- PASS: the answer shows genuine, specific, thoughtful engagement — even if brief, informal, or imperfectly written. A short but concrete, sincere answer should PASS. Do not penalize informal tone, spelling, or grammar.
- FLAG: the answer is a low-effort placeholder (e.g. "idk", "I would do it", single words, copy-pasted or repeated text across answers, answers that don't address the question at all, or answers that suggest genuinely poor judgement — e.g. "I'd just not show up and not tell anyone").

Default to PASS when in doubt. This is a filter for obviously disengaged submissions, not a bar for eloquence. A nervous or short but sincere answer must PASS.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{"verdict": "pass" | "flag", "reasoning": "one or two sentences explaining the decision"}`;

function buildUserPrompt(answers: readonly [string, string, string]): string {
  return READINESS_GATE_QUESTIONS.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i]}`).join("\n\n");
}

export async function gradeReadinessGateSubmission(
  answers: readonly [string, string, string],
): Promise<GradingResult> {
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
