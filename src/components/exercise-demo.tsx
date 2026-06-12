"use client";

import { useMemo, useState } from "react";
import { AnimatedSkeleton } from "@/components/exercise-guide/animated-skeleton";
import { resolveExerciseDemo } from "@/lib/exercises/exercise-demo-map";
import { resolveExerciseGif } from "@/lib/exercises/exercise-gif";
import { cn } from "@/lib/utils";

interface ExerciseDemoProps {
  exerciseId?: string;
  exerciseName?: string;
  className?: string;
  /** Icon thumbnail vs full how-to panel. */
  variant?: "icon" | "panel";
  compact?: boolean;
  width?: number;
  height?: number;
}

/** Real human GIF demo when available; skeleton animation as fallback. */
export function ExerciseDemo({
  exerciseId,
  exerciseName,
  className,
  variant = "panel",
  compact,
  width,
  height,
}: ExerciseDemoProps) {
  const gif = useMemo(() => resolveExerciseGif(exerciseId, exerciseName), [exerciseId, exerciseName]);
  const { guide, spec } = useMemo(
    () => resolveExerciseDemo(exerciseId, exerciseName),
    [exerciseId, exerciseName],
  );

  const isFrontOnly = !!guide.keyframes[0]?.leftShoulder;
  const hasFront = !!guide.frontKeyframes?.length || spec.preferFront || isFrontOnly;
  const defaultView =
    (spec.preferFront || isFrontOnly) && (guide.frontKeyframes?.length || isFrontOnly) ? "front" : "side";
  const [view, setView] = useState<"side" | "front">(defaultView);
  const skeletonView = spec.preferFront && guide.frontKeyframes?.length ? "front" : "side";

  if (gif?.gifUrl) {
    if (variant === "icon") {
      const w = width ?? 48;
      const h = height ?? 48;
      return (
        <div
          className={cn("relative overflow-hidden bg-[#0a0a0f]", className)}
          style={{ width: w, height: h }}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gif.gifUrl}
            alt=""
            className="h-full w-full object-cover object-center scale-110"
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div className={cn("rounded-xl border border-white/[0.06] bg-[#040408] overflow-hidden", className)}>
        <div className={cn("relative bg-[#0a0a0f]", compact ? "h-28" : "h-36 sm:h-44")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gif.gifUrl}
            alt={`${exerciseName ?? "Exercise"} demonstration`}
            className="h-full w-full object-contain object-center"
            loading="lazy"
          />
        </div>
        {!compact && (
          <p className="px-3 py-2 text-[11px] text-zinc-500 border-t border-white/[0.04] leading-relaxed">
            {guide.description}
          </p>
        )}
      </div>
    );
  }

  // Skeleton fallback
  if (variant === "icon") {
    const w = width ?? 48;
    const h = height ?? 48;
    return (
      <div className={cn("overflow-hidden bg-[#040408]", className)} style={{ width: w, height: h }}>
        <AnimatedSkeleton
          guide={guide}
          demoSpec={spec}
          width={w}
          height={h}
          ghost
          view={skeletonView}
        />
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-white/[0.06] bg-[#040408] overflow-hidden", className)}>
      {hasFront && (
        <div className="flex border-b border-white/[0.04]">
          {(["side", "front"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold uppercase tracking-[0.14em] min-h-[36px] transition-colors",
                view === v ? "text-cyan-300 bg-cyan-500/10" : "text-zinc-600 hover:text-zinc-400",
              )}
            >
              {v === "side" ? "Side view" : "Front view"}
            </button>
          ))}
        </div>
      )}
      <div className={cn("relative", compact ? "h-28" : "h-36 sm:h-44")}>
        <AnimatedSkeleton guide={guide} demoSpec={spec} ghost view={view} />
      </div>
      {!compact && guide.steps[0] && (
        <p className="px-3 py-2 text-[11px] text-zinc-500 border-t border-white/[0.04] leading-relaxed">
          {guide.description}
        </p>
      )}
    </div>
  );
}
