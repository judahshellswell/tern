import Anthropic from "@anthropic-ai/sdk";

let anthropic: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY env var.");
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

// A single short classification call (3 short answers -> pass/flag) —
// Haiku is the right size, no need for deeper reasoning here.
export const READINESS_GATE_MODEL = "claude-haiku-4-5";
