// Resolves per-exercise demo: unique pose animation + equipment props.

import { findLibraryByKey, findLibraryExerciseByName } from "@/lib/exercises/library";
import type { ExerciseVisualGuide } from "@/lib/exercises/exercise-visual-guides";
import { resolveDemoSpecForExercise, type ExerciseDemoSpec } from "@/lib/exercises/demo-spec";
import { getDemoPose } from "@/lib/exercises/demo-poses";

export interface ExerciseDemo {
  guide: ExerciseVisualGuide;
  spec: ExerciseDemoSpec;
}

/** Scale frame durations so one full loop ≈ 12 seconds. */
export function normalizeLoopDuration(guide: ExerciseVisualGuide, targetMs = 12_000): ExerciseVisualGuide {
  const total = guide.frameDurations.reduce((a, b) => a + b, 0);
  if (total <= 0 || Math.abs(total - targetMs) < 500) return guide;
  const scale = targetMs / total;
  return { ...guide, frameDurations: guide.frameDurations.map((d) => Math.round(d * scale)) };
}

export function resolveExerciseDemo(exerciseId?: string, exerciseName?: string): ExerciseDemo {
  const lib =
    (exerciseId ? findLibraryByKey(exerciseId) : undefined) ??
    (exerciseName ? findLibraryExerciseByName(exerciseName) : undefined);

  const spec = resolveDemoSpecForExercise(exerciseId, exerciseName);
  const pose = getDemoPose(spec.poseId);
  const displayName = lib?.name ?? exerciseName ?? pose.name;

  const guide = normalizeLoopDuration({
    ...pose,
    id: `${spec.poseId}-${lib?.id ?? exerciseId ?? "custom"}`,
    name: displayName,
    recommendedView: spec.preferFront ? "front" : pose.recommendedView,
  });

  return { guide, spec };
}

/** @deprecated use resolveExerciseDemo */
export function resolveDemoGuide(exerciseId?: string, exerciseName?: string): ExerciseVisualGuide {
  return resolveExerciseDemo(exerciseId, exerciseName).guide;
}
