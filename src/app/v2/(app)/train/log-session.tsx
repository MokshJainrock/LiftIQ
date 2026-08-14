"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, MoreHorizontal, Timer } from "lucide-react";
import {
  SESSION,
  SESSION_EXERCISES,
  fmtElapsed,
  fmtNum,
  type LoggedSet,
  type SessionExercise,
} from "@/lib/liftiq/demo-data";
import { ExerciseCard } from "@/components/liftiq/exercise-card";
import { RestTimer, type RestState } from "@/components/liftiq/rest-timer";
import type { SetPatch } from "@/components/liftiq/exercise-set";
import { Button, Card, Pill, Reveal } from "@/components/liftiq/primitives";

function restSeconds(rest: string) {
  const minutes = parseFloat(rest);
  return Number.isFinite(minutes) ? Math.round(minutes * 60) : 120;
}

export function LogSession() {
  const [exercises, setExercises] = useState<SessionExercise[]>(() =>
    SESSION_EXERCISES.map((ex) => ({ ...ex, sets: ex.sets.map((s) => ({ ...s })) })),
  );
  const [elapsed, setElapsed] = useState(SESSION.elapsedSeconds);
  const [rest, setRest] = useState<RestState>(null);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const patchSet = useCallback((exerciseId: string, setId: string, patch: SetPatch) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
          : ex,
      ),
    );
  }, []);

  const completeSet = useCallback(
    (exerciseId: string, setId: string) => {
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const index = ex.sets.findIndex((s) => s.id === setId);
          const sets = ex.sets.map((s, i) => {
            if (i === index) return { ...s, status: "done" as const };
            if (i === index + 1 && s.status === "upcoming") return { ...s, status: "active" as const };
            return s;
          });
          return { ...ex, sets };
        }),
      );

      const exercise = exercises.find((ex) => ex.id === exerciseId);
      if (exercise) {
        setRest({
          id: Date.now(),
          total: restSeconds(exercise.rest),
          exercise: exercise.name,
        });
      }
    },
    [exercises],
  );

  const addSet = useCallback((exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const hasActive = ex.sets.some((s) => s.status === "active");
        const next: LoggedSet = {
          id: `s${ex.sets.length + 1}-${Date.now()}`,
          previous: null,
          weight: null,
          reps: null,
          rpe: null,
          status: hasActive ? "upcoming" : "active",
        };
        return { ...ex, sets: [...ex.sets, next] };
      }),
    );
  }, []);

  const applyRecommendation = useCallback((exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) =>
            s.status === "done" ? s : { ...s, weight: ex.recommendation.weight },
          ),
        };
      }),
    );
  }, []);

  const stats = useMemo(() => {
    let sets = 0;
    let volume = 0;
    for (const ex of exercises) {
      for (const s of ex.sets) {
        if (s.status === "done" && s.weight && s.reps) {
          sets += 1;
          volume += s.weight * s.reps;
        }
      }
    }
    const totalSets = exercises.reduce((n, ex) => n + ex.sets.length, 0);
    return { sets, volume, totalSets };
  }, [exercises]);

  return (
    <div className="space-y-5">
      <Reveal>
        <Card elevated className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-2 w-2 items-center justify-center">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#b6f23a]" />
                </span>
                <p className="liq-eyebrow">Session in progress</p>
              </div>
              <h2 className="liq-tight mt-2 text-[24px] font-semibold liq-t1 md:text-[28px]">
                {SESSION.name}
              </h2>
              <p className="mt-1 text-[13px] liq-t2">{SESSION.date}</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="liq-eyebrow flex items-center justify-end gap-1.5">
                  <Timer size={12} />
                  Elapsed
                </p>
                <p className="liq-num mt-1 text-[28px] font-semibold leading-none liq-t1">
                  {fmtElapsed(elapsed)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="accent">
                  <CheckCircle2 size={15} />
                  Finish Workout
                </Button>
                <Button variant="ghost" className="w-10 px-0" title="More options">
                  <MoreHorizontal size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-4">
            <div>
              <p className="liq-eyebrow">Sets Logged</p>
              <p className="liq-num mt-1 text-[19px] font-semibold liq-t1">
                {stats.sets}
                <span className="text-[13px] font-medium liq-t3">/{stats.totalSets}</span>
              </p>
            </div>
            <div>
              <p className="liq-eyebrow">Volume</p>
              <p className="liq-num mt-1 text-[19px] font-semibold liq-t1">
                {fmtNum(stats.volume)}
                <span className="ml-1 text-[13px] font-medium liq-t3">lb</span>
              </p>
            </div>
            <div>
              <p className="liq-eyebrow">Session Focus</p>
              <div className="mt-1.5">
                <Pill tone="accent">Strength</Pill>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      {exercises.map((exercise, i) => (
        <Reveal key={exercise.id} delay={0.04 + i * 0.04}>
          <ExerciseCard
            exercise={exercise}
            onPatchSet={(setId, patch) => patchSet(exercise.id, setId, patch)}
            onCompleteSet={(setId) => completeSet(exercise.id, setId)}
            onAddSet={() => addSet(exercise.id)}
            onApplyRecommendation={() => applyRecommendation(exercise.id)}
          />
        </Reveal>
      ))}

      <RestTimer state={rest} onDismiss={() => setRest(null)} />
    </div>
  );
}
