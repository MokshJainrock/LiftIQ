"use client";

import { useMemo, useState } from "react";
import { AnimatedSkeleton } from "@/components/exercise-guide/animated-skeleton";
import { ExerciseDemoPlayer } from "@/components/exercise-guide/exercise-demo-player";
import { ExerciseDemoPoster } from "@/components/exercise-guide/exercise-demo-poster";
import { resolveExerciseDemo } from "@/lib/exercises/exercise-demo-map";
import { posterUrlForMedia, resolveExerciseGif } from "@/lib/exercises/exercise-gif";
import { cn } from "@/lib/utils";

interface ExerciseDemoProps {
  exerciseId?: string;
  exerciseName?: string;
  className?: string;
  variant?: "icon" | "panel" | "preview";
  compact?: boolean;
  width?: number;
  height?: number;
}

/** Human demo — static poster on lists; full video in modal. */
export function ExerciseDemo({
  exerciseId,
  exerciseName,
  className,
  variant = "panel",
  compact,
  width,
  height,
}: ExerciseDemoProps) {
  const media = useMemo(() => resolveExerciseGif(exerciseId, exerciseName), [exerciseId, exerciseName]);
  const poster = posterUrlForMedia(media);
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

  if (variant === "icon" || variant === "preview") {
    const w = width ?? (variant === "icon" ? 48 : undefined);
    const h = height ?? (variant === "icon" ? 48 : undefined);

    if (poster || media?.gifUrl) {
      return (
        <div
          className={cn(
            "overflow-hidden bg-[#050508]",
            variant === "preview" && cn("w-full", compact ? "h-28" : "h-36"),
            className,
          )}
          style={w && h ? { width: w, height: h } : undefined}
        >
          <ExerciseDemoPoster
            posterSrc={poster}
            gifFallback={media?.gifUrl}
            eager={variant === "icon"}
            className="h-full w-full"
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "overflow-hidden bg-[#040408]",
          variant === "preview" && cn("w-full", compact ? "h-28" : "h-36"),
          className,
        )}
        style={w && h ? { width: w, height: h } : undefined}
      >
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

  if (media?.videoUrl || media?.gifUrl) {
    return (
      <div className={cn("rounded-xl border border-white/[0.06] bg-[#040408] overflow-hidden", className)}>
        <div className={cn("relative bg-[#050508]", compact ? "h-28" : "h-36 sm:h-44")}>
          <ExerciseDemoPlayer
            videoSrc={media.videoUrl}
            gifSrc={media.gifUrl}
            posterSrc={poster}
            autoplay
            showControls={false}
            className="absolute inset-0"
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
    </div>
  );
}
