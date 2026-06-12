"use client";

import { useMemo, useState } from "react";
import { AnimatedSkeleton } from "@/components/exercise-guide/animated-skeleton";
import { resolveDemoGuide } from "@/lib/exercises/exercise-demo-map";
import { cn } from "@/lib/utils";

/** ~12 second looping demo with side + front views. */
export function ExerciseHowTo({
  exerciseId,
  exerciseName,
  className,
  compact,
}: {
  exerciseId?: string;
  exerciseName?: string;
  className?: string;
  /** Smaller layout for inline cards. */
  compact?: boolean;
}) {
  const guide = useMemo(
    () => resolveDemoGuide(exerciseId, exerciseName),
    [exerciseId, exerciseName],
  );
  const hasFront = !!guide.frontKeyframes?.length;
  const [view, setView] = useState<"side" | "front">("side");

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
        <AnimatedSkeleton guide={guide} ghost view={view} />
      </div>
      {!compact && guide.steps[0] && (
        <p className="px-3 py-2 text-[11px] text-zinc-500 border-t border-white/[0.04] leading-relaxed">
          {guide.description}
        </p>
      )}
    </div>
  );
}
