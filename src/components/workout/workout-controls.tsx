"use client";

import { useState } from "react";
import { useWorkoutStore } from "@/lib/store";
import { saveSession, updateStreak, getSessions } from "@/lib/storage";
import { saveRecording } from "@/lib/storage/recordings-db";
import { getExercise } from "@/lib/exercises";
import { WorkoutSession } from "@/types";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw, CircleDot, X, Dumbbell, Minus, Plus } from "lucide-react";

/** Last weight the user logged for this exercise, for prefill. */
function lastWeightFor(exercise: string): number | undefined {
  const prior = getSessions().find(
    (s) => s.exercise === exercise && typeof s.weight === "number" && s.weight > 0,
  );
  return prior?.weight;
}

export function WorkoutControls() {
  const {
    isWorkoutActive,
    isPaused,
    isRecording,
    isCountingDown,
    isFormChecking,
    selectedExercise,
    hasSelectedExercise,
    sessionStartTime,
    sessionWeight,
    setSessionWeight,
    startCountdown,
    cancelCountdown,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    clearRepResults,
    setLastSession,
    setRecordingBlob,
    setRepCount,
    setCurrentScore,
    setCurrentCues,
    setCurrentIssues,
    setCurrentPhase,
  } = useWorkoutStore();

  const [showWeightPrompt, setShowWeightPrompt] = useState(false);
  const [weightInput, setWeightInput] = useState("");

  const beginCountdown = (weight: number | undefined) => {
    setSessionWeight(weight);
    setShowWeightPrompt(false);
    clearRepResults();
    setRecordingBlob(null);
    startCountdown();
  };

  const handleStart = () => {
    if (!hasSelectedExercise || !selectedExercise) return;
    const prefill = sessionWeight ?? lastWeightFor(selectedExercise);
    setWeightInput(prefill && prefill > 0 ? String(prefill) : "");
    setShowWeightPrompt(true);
  };

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weightInput) || 0;
    const next = Math.max(0, current + delta);
    setWeightInput(next > 0 ? String(next) : "");
  };

  const confirmWeight = () => {
    const parsed = parseFloat(weightInput);
    beginCountdown(Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
  };

  const handleStop = async () => {
    // Stop the workout FIRST so the frame loop stops counting reps immediately
    const wasRecording = isRecording;
    stopWorkout();

    // Snapshot store state right after stopping to avoid closure staleness
    const snap = useWorkoutStore.getState();
    const finalReps = [...snap.repResults];
    const config = getExercise(selectedExercise);
    const now = Date.now();

    const totalScore =
      finalReps.length > 0
        ? Math.round(
            finalReps.reduce((s, r) => s + r.score, 0) / finalReps.length
          )
        : 0;

    const caloriesBurned = finalReps.length * (config?.caloriesPerRep || 0.3);

    const recordingId = wasRecording ? `rec-${now}` : undefined;

    const bestIdx = finalReps.length > 0
      ? finalReps.reduce((best, r, i) => (r.score > finalReps[best].score ? i : best), 0)
      : -1;

    const bestRep = bestIdx >= 0 ? finalReps[bestIdx] : null;

    const bestRepReasons: import("@/types").PerfectRepReason[] = [];
    if (bestRep) {
      if (bestRep.score >= 90) bestRepReasons.push("high_score");
      if (bestRep.issues.length === 0) bestRepReasons.push("zero_issues");
      if ((bestRep.issueCount ?? bestRep.issues.length) === 0 && bestRep.score >= 85) bestRepReasons.push("full_rom");
      if (bestRep.score >= 95) bestRepReasons.push("stable_form");
      if (bestIdx > 0) {
        const prev = finalReps[bestIdx - 1];
        if (Math.abs(bestRep.score - prev.score) <= 5 && bestRep.score >= 80) bestRepReasons.push("consistent_tempo");
      }
    }

    const perfectRepCount = finalReps.filter((r) => r.score >= 90).length;

    const allIssues = finalReps.flatMap((r) => r.issues);
    const issueCounts: Record<string, number> = {};
    for (const iss of allIssues) if (iss.message) issueCounts[iss.message] = (issueCounts[iss.message] || 0) + 1;
    const mistakeSummary = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));

    const scoreTimeline = finalReps.map((r) => ({
      time: r.timestamp - (sessionStartTime || now),
      score: r.score,
    }));

    const session: WorkoutSession = {
      id: `session-${now}`,
      exercise: selectedExercise,
      exerciseName: config?.name || selectedExercise,
      weight: sessionWeight,
      startTime: sessionStartTime || now,
      endTime: now,
      reps: finalReps,
      totalScore,
      caloriesBurned: Math.round(caloriesBurned * 10) / 10,
      isRecorded: wasRecording,
      recordingId,
      bestRepIndex: bestIdx,
      bestRepScore: bestRep?.score ?? 0,
      bestRepTimestamp: bestRep?.timestamp ?? 0,
      bestRepReasons,
      perfectRepCount,
      scoreTimeline,
      mistakeSummary,
    };

    setLastSession(session);

    try {
      saveSession(session);
      await updateStreak();
    } catch (err) {
      console.warn("Workout save/sync failed:", err);
    }

    if (wasRecording && recordingId) {
      const duration = Math.floor((now - (sessionStartTime || now)) / 1000);
      const trySaveRecording = async (attempt = 0): Promise<void> => {
        const blob = useWorkoutStore.getState().recordingBlob;
        if (blob) {
          await saveRecording(
            {
              id: recordingId,
              sessionId: session.id,
              exercise: selectedExercise,
              exerciseName: config?.name || selectedExercise,
              reps: finalReps.length,
              score: totalScore,
              duration,
              createdAt: now,
              size: blob.size,
            },
            blob
          );
          setRecordingBlob(null);
        } else if (attempt < 20) {
          await new Promise((r) => setTimeout(r, 300));
          return trySaveRecording(attempt + 1);
        }
      };
      setTimeout(() => void trySaveRecording(), 300);
    }
  };

  const handleReset = () => {
    clearRepResults();
    setRepCount(0);
    setCurrentScore(100);
    setCurrentCues([]);
    setCurrentIssues([]);
    setCurrentPhase("");
    stopWorkout();
    setLastSession(null);
  };

  return (
    <div className="glass-card w-full rounded-2xl p-3">
      {isCountingDown || isFormChecking ? (
        <Button
          onClick={cancelCountdown}
          variant="outline"
          size="lg"
          className="w-full min-h-[48px] rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      ) : !isWorkoutActive ? (
        showWeightPrompt ? (
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
              <Dumbbell className="h-3.5 w-3.5 text-cyan-400" />
              Weight for this set (lbs)
            </div>
            <div className="flex items-stretch gap-2">
              <Button
                onClick={() => adjustWeight(-5)}
                variant="outline"
                size="lg"
                aria-label="Decrease weight by 5 lbs"
                className="min-h-[48px] shrink-0 rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-4"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="2.5"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmWeight()}
                placeholder="Bodyweight"
                autoFocus
                className="min-h-[48px] w-full min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-center text-lg font-bold tabular-nums text-zinc-100 outline-none transition-colors placeholder:text-sm placeholder:font-medium placeholder:text-zinc-600 focus:border-cyan-500/40"
              />
              <Button
                onClick={() => adjustWeight(5)}
                variant="outline"
                size="lg"
                aria-label="Increase weight by 5 lbs"
                className="min-h-[48px] shrink-0 rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-4"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={confirmWeight}
                size="lg"
                className="min-h-[48px] flex-1 rounded-xl shadow-md shadow-primary/15 transition-all hover:shadow-lg hover:shadow-primary/20 hover:brightness-105"
              >
                <Play className="h-4 w-4" />
                {parseFloat(weightInput) > 0 ? `Start @ ${parseFloat(weightInput)} lbs` : "Start (bodyweight)"}
              </Button>
              <Button
                onClick={() => setShowWeightPrompt(false)}
                variant="outline"
                size="lg"
                className="min-h-[48px] shrink-0 rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-stretch">
          <Button
            onClick={handleStart}
            size="lg"
            disabled={!hasSelectedExercise || !selectedExercise}
            className="w-full min-h-[48px] rounded-xl shadow-md shadow-primary/15 transition-all hover:shadow-lg hover:shadow-primary/20 hover:brightness-105 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Start
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="min-h-[48px] rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all sm:shrink-0 sm:px-5"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        )
      ) : (
        <div className="flex w-full items-stretch gap-2">
          {isRecording && (
            <div
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl glass-card border-red-500/20 px-2.5 min-h-[48px] min-w-[3.25rem]"
              aria-hidden
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]" />
              </span>
              <CircleDot className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-red-400 leading-none">
                REC
              </span>
            </div>
          )}
          {isPaused ? (
            <Button
              onClick={resumeWorkout}
              variant="outline"
              size="lg"
              className="min-h-[48px] flex-1 rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all"
            >
              <Play className="h-4 w-4" />
              Resume
            </Button>
          ) : (
            <Button
              onClick={pauseWorkout}
              variant="outline"
              size="lg"
              className="min-h-[48px] flex-1 rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          <Button
            onClick={handleStop}
            variant="destructive"
            size="lg"
            className="min-h-[48px] shrink-0 rounded-xl shadow-md shadow-destructive/20 hover:shadow-lg hover:shadow-destructive/30 transition-all px-4 sm:px-5"
          >
            <Square className="h-4 w-4" />
            End
          </Button>
        </div>
      )}
    </div>
  );
}
