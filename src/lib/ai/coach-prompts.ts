// Pure prompt builder for the post-workout AI coach. Shared shape between the
// client (request body) and /api/coach-feedback (prompt construction).

export interface CoachFeedbackInput {
  exercise: string;
  /** Per-rep form scores, 0–100, in order. */
  repScores: number[];
  avgScore: number;
  durationSec: number;
  weight?: number;
  caloriesBurned?: number;
  /** Deduped issue messages with how often each was flagged. */
  mistakes: { issue: string; count: number }[];
  bestRepIndex?: number;
  bestRepScore?: number;
}

export function buildCoachPrompt(input: CoachFeedbackInput): string {
  const {
    exercise,
    repScores,
    avgScore,
    durationSec,
    weight,
    caloriesBurned,
    mistakes,
    bestRepIndex,
    bestRepScore,
  } = input;

  const exerciseName = exercise.replace(/-/g, " ");
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;

  const half = Math.floor(repScores.length / 2);
  const firstAvg = half > 0 ? Math.round(repScores.slice(0, half).reduce((s, n) => s + n, 0) / half) : avgScore;
  const secondAvg =
    repScores.length - half > 0
      ? Math.round(repScores.slice(half).reduce((s, n) => s + n, 0) / (repScores.length - half))
      : avgScore;

  const lines = [
    `Exercise: ${exerciseName}`,
    `Reps completed: ${repScores.length}`,
    `Per-rep form scores (0-100, in order): ${repScores.join(", ") || "none"}`,
    `Average form score: ${avgScore}/100`,
    `First half avg: ${firstAvg} | Second half avg: ${secondAvg}`,
    `Duration: ${mins}m ${secs}s`,
  ];
  if (typeof weight === "number" && weight > 0) lines.push(`Weight used: ${weight} lbs`);
  if (typeof caloriesBurned === "number") lines.push(`Estimated calories: ${caloriesBurned}`);
  if (typeof bestRepIndex === "number" && typeof bestRepScore === "number") {
    lines.push(`Best rep: #${bestRepIndex + 1} scored ${bestRepScore}/100`);
  }
  if (mistakes.length > 0) {
    lines.push(
      `Form issues confirmed by the pose tracker (each count = number of reps where the issue was sustained across multiple frames, out of ${repScores.length} reps): ${mistakes
        .map((m) => `"${m.issue}" in ${m.count} rep${m.count === 1 ? "" : "s"}`)
        .join("; ")}`,
    );
  } else {
    lines.push(
      "No form issues were confirmed by the pose tracker — this was a clean session; do not invent any problems.",
    );
  }

  return `You are an expert, encouraging personal trainer reviewing a workout that was analyzed by a computer-vision form tracker.

Session data:
${lines.join("\n")}

Write a short coaching analysis (3-5 sentences, plain text, no markdown, no headings, no emoji) that:
1. Opens with an honest one-line read on the session quality grounded in the average score.
2. If issues were confirmed: calls out the single most frequent one, states exactly how many of the ${repScores.length} reps it appeared in, and gives ONE concrete fix to try next session. If no issues were confirmed: acknowledge the clean form instead.
3. Notes the score trend across the set (improving, fading, or steady — use the first/second half averages) and what that suggests (warmup, fatigue, pacing).
4. Ends with one specific, motivating next step.

Rules: be specific to ${exerciseName}; ONLY mention issues listed in the data above, with their exact rep counts — never speculate about problems the tracker did not confirm; never give medical advice; keep it under 110 words.`;
}
