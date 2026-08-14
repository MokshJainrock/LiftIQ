"use client";

import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/lib/store";
import { getWorkoutRecommendations, type WorkoutRecommendation } from "@/lib/recommendations";
import { Wand2, Scale, Crosshair, Flag, TrendingUp, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_ICON = {
  balance: Scale,
  form: Crosshair,
  goal: Flag,
  progress: TrendingUp,
  start: Play,
} as const;

interface Props {
  /** Called after a recommendation is selected (e.g. to collapse pickers). */
  onSelect?: () => void;
  className?: string;
}

export function RecommendedWorkouts({ onSelect, className }: Props) {
  const { selectedExercise, setSelectedExercise, setHasSelectedExercise, setSessionWeight } =
    useWorkoutStore();
  const [recs, setRecs] = useState<WorkoutRecommendation[]>([]);

  // History lives in localStorage — compute after mount to stay SSR-safe.
  useEffect(() => {
    queueMicrotask(() => setRecs(getWorkoutRecommendations()));
  }, []);

  if (recs.length === 0) return null;

  const handlePick = (rec: WorkoutRecommendation) => {
    setSelectedExercise(rec.exerciseId);
    setHasSelectedExercise(true);
    setSessionWeight(undefined);
    onSelect?.();
  };

  return (
    <div className={className}>
      <div className="mb-2.5 flex items-center gap-2">
        <Wand2 className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
          Recommended for you
        </h3>
      </div>
      <div className="space-y-1.5">
        {recs.map((rec) => {
          const Icon = KIND_ICON[rec.kind];
          const active = selectedExercise === rec.exerciseId;
          return (
            <button
              key={rec.exerciseId + rec.kind}
              type="button"
              onClick={() => handlePick(rec)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.99]",
                active
                  ? "border-primary/30 bg-primary/[0.08]"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-primary/20 hover:bg-white/[0.04]",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                  active
                    ? "border-primary/30 bg-primary/15 text-primary"
                    : "border-white/[0.08] bg-white/[0.03] text-zinc-400 group-hover:text-primary",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-semibold", active ? "text-primary" : "text-zinc-200")}>
                  {rec.name}
                </span>
                <span className="block truncate text-[11px] text-zinc-500">{rec.reason}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
