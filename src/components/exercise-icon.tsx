"use client";

import { useMemo } from "react";
import { AnimatedSkeleton } from "@/components/exercise-guide/animated-skeleton";
import { resolveDemoGuide } from "@/lib/exercises/exercise-demo-map";
import { cn } from "@/lib/utils";

/**
 * Exercise-specific animated thumbnail — barbell curl shows a curl,
 * bench press shows a press, etc. (not a generic muscle emoji).
 */
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
  const guide = useMemo(
    () => resolveDemoGuide(exerciseId, exerciseName),
    [exerciseId, exerciseName],
  );

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
      <AnimatedSkeleton guide={guide} width={dim.w} height={dim.h} ghost view="side" />
    </div>
  );
}
