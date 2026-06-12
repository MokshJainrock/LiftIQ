// Builds a WorkoutSession from manually entered sets (no camera) and rates it
// against the user's history. Shared by the quick logger and live workout mode.

import { LoggedSet, RepResult, WorkoutSession } from "@/types";
import { rateManualWorkout, ManualRating } from "@/lib/manual-rating";
import { findLibraryExerciseByName } from "@/lib/exercises/library";

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Session key for an exercise name. Camera-trackable movements share keys with
 * camera sessions (e.g. "Bodyweight Squat" -> "squat") so PRs merge.
 */
export function resolveExerciseKey(name: string): string {
  const lib = findLibraryExerciseByName(name);
  return lib?.trackingId ?? lib?.id ?? slugify(name);
}

export interface BuiltManualSession {
  session: WorkoutSession;
  rating: ManualRating;
}

export function buildManualSession(
  exerciseName: string,
  sets: LoggedSet[],
  history: WorkoutSession[],
  opts?: { startTime?: number; endTime?: number },
): BuiltManualSession {
  const exerciseKey = resolveExerciseKey(exerciseName);
  const rating = rateManualWorkout(exerciseKey, sets, history);

  const totalReps = sets.reduce((n, s) => n + s.reps, 0);
  const isWeighted = sets.some((s) => (s.weight ?? 0) > 0);
  const end = opts?.endTime ?? Date.now();
  const repDurationMs = 4000;
  const start = opts?.startTime ?? end - totalReps * repDurationMs;

  const reps: RepResult[] = [];
  const span = Math.max(1, end - start);
  let i = 0;
  sets.forEach((s, setIndex) => {
    for (let r = 0; r < s.reps; r++) {
      reps.push({
        score: rating.score,
        issues: [],
        timestamp: start + Math.round((i / Math.max(1, totalReps)) * span),
        setIndex,
        weight: s.weight,
      });
      i++;
    }
  });

  const topWeight = Math.max(0, ...sets.map((s) => s.weight ?? 0));
  const session: WorkoutSession = {
    id: `manual-${crypto.randomUUID()}`,
    exercise: exerciseKey,
    exerciseName,
    weight: topWeight > 0 ? topWeight : undefined,
    startTime: start,
    endTime: end,
    reps,
    totalScore: rating.score,
    caloriesBurned: Math.round(totalReps * (isWeighted ? 0.6 : 0.4)),
    source: "manual",
    sets,
  };

  return { session, rating };
}
