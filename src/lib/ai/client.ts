// Client-side helpers for the AI coach API routes. The OpenAI key lives only
// on the server; these wrappers degrade to null/[] so callers can fall back
// to the rule-based generators.

import type { WorkoutSession, JointFeedback } from "@/types";
import type { FormExplanation } from "./explainer-prompts";

export async function fetchCoachFeedback(session: WorkoutSession): Promise<string | null> {
  try {
    const res = await fetch("/api/coach-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exercise: session.exerciseName || session.exercise,
        repScores: session.reps.map((r) => r.score),
        avgScore: session.totalScore,
        durationSec: session.endTime ? Math.floor((session.endTime - session.startTime) / 1000) : 0,
        weight: session.weight,
        caloriesBurned: session.caloriesBurned,
        mistakes: session.mistakeSummary ?? summarizeMistakes(session),
        bestRepIndex: session.bestRepIndex,
        bestRepScore: session.bestRepScore,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { feedback?: string; source?: string };
    return data.source === "ai" && data.feedback ? data.feedback : null;
  } catch {
    return null;
  }
}

export async function fetchFormExplanations(
  issues: JointFeedback[],
  exercise: string,
): Promise<FormExplanation[]> {
  try {
    const res = await fetch("/api/explain-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise, issues }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { explanations?: FormExplanation[] };
    return Array.isArray(data.explanations) ? data.explanations : [];
  } catch {
    return [];
  }
}

function summarizeMistakes(session: WorkoutSession): { issue: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const rep of session.reps) {
    for (const issue of rep.issues) {
      if (issue.message) counts[issue.message] = (counts[issue.message] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([issue, count]) => ({ issue, count }));
}
