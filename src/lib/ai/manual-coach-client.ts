// Client-side helpers for the manual-workout AI endpoints. All failures
// resolve to empty results — callers keep their deterministic fallbacks.

import { LoggedSet, WorkoutSession } from "@/types";
import { WeightUnit } from "@/lib/units";
import { findLibraryByKey, findLibraryExerciseByName } from "@/lib/exercises/library";
import type { ManualHistoryEntry } from "@/lib/ai/manual-coach-prompts";

const DAY_MS = 86_400_000;

function sessionVolume(s: WorkoutSession): number {
  if (s.sets?.length) return s.sets.reduce((n, st) => n + (st.weight ?? 1) * st.reps, 0);
  return (s.weight ?? 1) * s.reps.length;
}

function sessionTopWeight(s: WorkoutSession): number | undefined {
  const top = s.sets?.length
    ? Math.max(...s.sets.map((st) => st.weight ?? 0))
    : (s.weight ?? 0);
  return top > 0 ? top : undefined;
}

/** Recent history of one exercise, shaped for the manual-coach route. */
export function buildExerciseHistory(
  exerciseKey: string,
  sessions: WorkoutSession[],
): ManualHistoryEntry[] {
  const now = Date.now();
  return sessions
    .filter((s) => s.exercise === exerciseKey)
    .slice(-6, -1) // exclude the session just saved
    .reverse()
    .map((s) => ({
      daysAgo: Math.floor((now - s.startTime) / DAY_MS),
      volume: Math.round(sessionVolume(s)),
      topWeight: sessionTopWeight(s),
      totalReps: s.reps.length,
    }));
}

export async function fetchManualCoachFeedback(opts: {
  exerciseName: string;
  exerciseKey: string;
  sets: LoggedSet[];
  ratingScore: number;
  unit: WeightUnit;
  sessions: WorkoutSession[];
}): Promise<string> {
  try {
    const res = await fetch("/api/manual-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseName: opts.exerciseName,
        sets: opts.sets,
        ratingScore: opts.ratingScore,
        unit: opts.unit,
        history: buildExerciseHistory(opts.exerciseKey, opts.sessions),
      }),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { feedback?: string };
    return data.feedback?.trim() ?? "";
  } catch {
    return "";
  }
}

export interface AISuggestion {
  name: string;
  reason: string;
}

export async function fetchAISuggestions(
  sessions: WorkoutSession[],
  goal?: string,
): Promise<{ focus: string; suggestions: AISuggestion[] }> {
  const now = Date.now();
  const recent = sessions.slice(-15).reverse();

  const recentSummary = recent.map((s) => {
    const name = s.exerciseName || s.exercise;
    const lib = findLibraryByKey(s.exercise) ?? findLibraryExerciseByName(name);
    const days = Math.floor((now - s.startTime) / DAY_MS);
    const setCount = s.sets?.length ?? Math.max(1, Math.round(s.reps.length / 10));
    return `${days === 0 ? "Today" : `${days}d ago`}: ${name} (${lib?.muscle ?? "unknown"}) ${setCount} sets, ${s.reps.length} reps`;
  });

  const muscleCounts: Record<string, number> = {};
  for (const s of recent) {
    if (now - s.startTime > 7 * DAY_MS) continue;
    const lib = findLibraryByKey(s.exercise) ?? findLibraryExerciseByName(s.exerciseName ?? "");
    const m = lib?.muscle ?? "other";
    muscleCounts[m] = (muscleCounts[m] ?? 0) + 1;
  }

  try {
    const res = await fetch("/api/suggest-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recentSummary, muscleCounts, goal }),
    });
    if (!res.ok) return { focus: "", suggestions: [] };
    const data = (await res.json()) as { focus?: string; suggestions?: AISuggestion[] };
    return { focus: data.focus ?? "", suggestions: data.suggestions ?? [] };
  } catch {
    return { focus: "", suggestions: [] };
  }
}
