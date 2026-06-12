"use client";

import { ExerciseDemo } from "@/components/exercise-demo";

/** ~12 second looping demo — real human GIF when available. */
export function ExerciseHowTo({
  exerciseId,
  exerciseName,
  className,
  compact,
}: {
  exerciseId?: string;
  exerciseName?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <ExerciseDemo
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      className={className}
      variant="panel"
      compact={compact}
    />
  );
}
