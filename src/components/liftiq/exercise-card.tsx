"use client";

import { ArrowUpRight, Plus, Timer } from "lucide-react";
import type { SessionExercise } from "@/lib/liftiq/demo-data";
import { Button, Card, Pill } from "./primitives";
import { ExerciseSetCard, ExerciseSetRow, type SetPatch } from "./exercise-set";

/** One exercise block on the Train page: prescription, set log, and coaching. */
export function ExerciseCard({
  exercise,
  onPatchSet,
  onCompleteSet,
  onAddSet,
  onApplyRecommendation,
}: {
  exercise: SessionExercise;
  onPatchSet: (setId: string, patch: SetPatch) => void;
  onCompleteSet: (setId: string) => void;
  onAddSet: () => void;
  onApplyRecommendation: () => void;
}) {
  const completed = exercise.sets.filter((s) => s.status === "done").length;

  return (
    <Card className="overflow-hidden">
      {/* Prescription */}
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h3 className="liq-tight text-[16px] font-semibold liq-t1">{exercise.name}</h3>
            <Pill>{exercise.muscle}</Pill>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] liq-t2">
            <span>
              Target{" "}
              <span className="liq-num font-semibold liq-t1">
                {exercise.targetSets} × {exercise.targetReps}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Timer size={13} className="text-[#6b7280]" />
              Rest <span className="font-semibold liq-t1">{exercise.rest}</span>
            </span>
            <span>
              Previous <span className="liq-num font-semibold liq-t1">{exercise.previousBest}</span>
            </span>
          </div>
        </div>

        <span className="liq-num rounded-lg bg-white/[0.04] px-2.5 py-1 text-[12px] font-semibold liq-t2">
          {completed}/{exercise.sets.length}
        </span>
      </div>

      {/* Desktop set table */}
      <div className="hidden px-5 md:block">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              {["Set", "Previous", "Weight", "Reps", "RPE", ""].map((h, i) => (
                <th
                  key={h || i}
                  className={`pb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] liq-t3 ${
                    i === 5 ? "text-right" : ""
                  } ${i === 0 ? "pl-1" : "px-2"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map((set, i) => (
              <ExerciseSetRow
                key={set.id}
                index={i}
                set={set}
                onPatch={(patch) => onPatchSet(set.id, patch)}
                onComplete={() => onCompleteSet(set.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile set cards */}
      <div className="space-y-2.5 px-4 md:hidden">
        {exercise.sets.map((set, i) => (
          <ExerciseSetCard
            key={set.id}
            index={i}
            set={set}
            onPatch={(patch) => onPatchSet(set.id, patch)}
            onComplete={() => onCompleteSet(set.id)}
          />
        ))}
      </div>

      <div className="px-4 pt-4 md:px-5">
        <button
          onClick={onAddSet}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-white/[0.11] text-[13px] font-medium liq-t2 transition-colors duration-150 hover:border-white/25 hover:bg-white/[0.03]"
        >
          <Plus size={15} />
          Add Set
        </button>
      </div>

      {/* Progressive overload recommendation */}
      <div className="mt-4 border-t border-white/[0.06] bg-white/[0.015] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="liq-eyebrow mb-1.5">Lift IQ Recommendation</p>
            <p className="text-[14px] font-semibold liq-t1">
              {exercise.recommendation.delta === "hold"
                ? `Hold ${exercise.recommendation.weight} lb today`
                : `Try ${exercise.recommendation.weight} lb today`}
              <span className="liq-num ml-2 rounded-md bg-[#b6f23a]/12 px-1.5 py-0.5 text-[11.5px] font-semibold text-[#b6f23a]">
                {exercise.recommendation.delta}
              </span>
            </p>
            <p className="mt-1 text-[12.5px] liq-t2">{exercise.recommendation.rationale}</p>
          </div>

          <Button size="sm" variant="ghost" onClick={onApplyRecommendation}>
            Apply
            <ArrowUpRight size={13} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
