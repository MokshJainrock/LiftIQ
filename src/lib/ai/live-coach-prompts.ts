export interface LiveCoachInput {
  exerciseName: string;
  phase: string;
  repCount: number;
  score: number | null;
  confidenceTier: "high" | "medium" | "low";
  issues: string[];
  ruleCues: string[];
}

export function buildLiveCoachPrompt(input: LiveCoachInput): string {
  const issues = input.issues.slice(0, 4).join("; ") || "none";
  const ruleCues = input.ruleCues.slice(0, 2).join("; ") || "none";
  const scoreLine =
    input.score === null
      ? "Form score: withheld (low camera confidence — reps still count)"
      : `Form score: ${input.score}/100 (${input.confidenceTier} confidence)`;

  return `You are a live gym coach. The athlete is mid-set. Give ONE short coaching cue (max 12 words) they can act on immediately.

Exercise: ${input.exerciseName}
Phase: ${input.phase}
Reps so far: ${input.repCount}
${scoreLine}
Detected issues: ${issues}
Rule-based cues already shown: ${ruleCues}

Rules:
- One sentence only. Imperative voice. No greeting, no markdown.
- If form looks good, encourage briefly ("Strong lockout — keep that tempo").
- If ${input.confidenceTier === "low" ? "confidence is LOW" : "issues exist"}, focus on setup/framing OR the top issue — never invent problems.
- Do not mention AI, scores, or cameras.`;
}
