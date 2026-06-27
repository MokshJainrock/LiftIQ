"use client";

import { useMemo } from "react";
import { AnimatedSkeleton } from "@/components/exercise-guide/animated-skeleton";
import { resolveExerciseDemo } from "@/lib/exercises/exercise-demo-map";
import { cn } from "@/lib/utils";

interface ExerciseDemoFallbackProps {
  exerciseId?: string;
  exerciseName?: string;
  className?: string;
  width?: number;
  height?: number;
  ghost?: boolean;
  showControls?: boolean;
}

/** Animated form guide — always available when GIF/video fails. */
export function ExerciseDemoFallback({
  exerciseId,
  exerciseName,
  className,
  width,
  height,
  ghost = true,
  showControls = false,
}: ExerciseDemoFallbackProps) {
  const { guide, spec } = useMemo(
    () => resolveExerciseDemo(exerciseId, exerciseName),
    [exerciseId, exerciseName],
  );

  const isFrontOnly = !!guide.keyframes[0]?.leftShoulder;
  const view =
    (spec.preferFront || isFrontOnly) && (guide.frontKeyframes?.length || isFrontOnly)
      ? "front"
      : "side";

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-[#050508]", className)}>
      <AnimatedSkeleton
        guide={guide}
        demoSpec={spec}
        width={width}
        height={height}
        ghost={ghost}
        view={view}
        showControls={showControls}
      />
    </div>
  );
}
