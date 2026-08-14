"use client";

import { useMemo, useState } from "react";
import { useWorkoutStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Dumbbell,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  getTrackableLibraryExercises,
  countTrackableExercises,
} from "@/lib/exercises/tracking-resolver";
import { EXERCISE_LIBRARY } from "@/lib/exercises/library";
import { ExerciseHowTo } from "@/components/exercise-how-to";

interface ExerciseSelectorProps {
  onSelect?: () => void;
}

export function ExerciseSelector({ onSelect }: ExerciseSelectorProps) {
  const {
    selectedExercise,
    selectedExerciseLabel,
    setSelectedExercise,
    setSelectedExerciseLabel,
    setHasSelectedExercise,
    isWorkoutActive,
  } = useWorkoutStore();

  const [query, setQuery] = useState("");
  const trackable = useMemo(() => getTrackableLibraryExercises(), []);
  const totalLibrary = EXERCISE_LIBRARY.length;
  const trackableCount = countTrackableExercises();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trackable;
    return trackable.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscle.toLowerCase().includes(q) ||
        e.equipment.toLowerCase().includes(q),
    );
  }, [query, trackable]);

  const selectedKey = selectedExerciseLabel || selectedExercise;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={2} />
            <h3 className="text-sm font-bold text-zinc-200">AI Exercise</h3>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            {trackableCount} AI-tracked · {totalLibrary} in library
          </p>
        </div>
        <span className="text-[9px] uppercase tracking-wider font-bold text-primary/80 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
          Camera AI
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${trackableCount} AI exercises…`}
          className="w-full h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] pl-9 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
        {filtered.map((exercise) => {
          const sel =
            selectedExercise === exercise.templateId &&
            (selectedExerciseLabel === exercise.name || !selectedExerciseLabel);
          return (
            <button
              key={exercise.id}
              onClick={() => {
                if (!isWorkoutActive) {
                  setSelectedExercise(exercise.templateId);
                  setSelectedExerciseLabel(exercise.name);
                  setHasSelectedExercise(true);
                  onSelect?.();
                }
              }}
              disabled={isWorkoutActive}
              className={cn(
                "flex items-start gap-2 rounded-xl px-3 py-2.5 text-left min-h-[44px] transition-all",
                "glass-card hover:bg-white/[0.03]",
                sel && "bg-primary/[0.08] text-primary border-primary/15 glow-sm",
                !sel && "text-zinc-400 hover:text-zinc-200",
                isWorkoutActive && "opacity-40 cursor-not-allowed",
              )}
            >
              <Dumbbell className={cn("h-4 w-4 shrink-0 mt-0.5", sel ? "text-primary" : "text-zinc-600")} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{exercise.name}</div>
                <div className="text-[10px] text-zinc-600 capitalize truncate">
                  {exercise.muscle} · {exercise.equipment}
                </div>
              </div>
              {exercise.trackingId && (
                <Zap className="h-3 w-3 text-amber-400/80 shrink-0 mt-1" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-zinc-600 text-center py-3">No AI-trackable match. Try another search.</p>
      )}

      {selectedKey && (
        <div className="space-y-2">
          <p className="text-[10px] text-zinc-500">
            Selected: <span className="text-zinc-300 font-medium">{selectedExerciseLabel || selectedExercise}</span>
          </p>
          <ExerciseHowTo
            exerciseName={selectedExerciseLabel || undefined}
            exerciseId={selectedExercise}
            compact
            className="rounded-xl overflow-hidden border border-white/[0.06]"
          />
        </div>
      )}
    </div>
  );
}
