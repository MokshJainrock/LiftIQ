"use client";

import { ExerciseDemo } from "@/components/exercise-demo";
import { cn } from "@/lib/utils";

export function ExerciseIcon({
  exerciseId,
  exerciseName,
  muscle,
  size = "md",
  className,
}: {
  exerciseId?: string;
  exerciseName?: string;
  /** @deprecated use exerciseId/exerciseName — kept for backward compat */
  muscle?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim =
    size === "sm" ? { w: 32, h: 32 } : size === "lg" ? { w: 48, h: 48 } : { w: 40, h: 40 };

  return (
    <div
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-[#040408]",
        size === "sm" && "rounded-lg",
        className,
      )}
      style={{ width: dim.w, height: dim.h }}
      aria-hidden="true"
    >
      <ExerciseDemo
        exerciseId={exerciseId}
        exerciseName={exerciseName}
        variant="icon"
        width={dim.w}
        height={dim.h}
      />
    </div>
  );
}
