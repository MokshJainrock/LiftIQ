"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  LayoutList,
  ListPlus,
  NotebookPen,
  Radio,
  ScanLine,
  Timer,
  Video,
} from "lucide-react";
import { WebcamFeed } from "@/components/workout/webcam-feed";
import { ExerciseCameraPlaceholder } from "@/components/workout/exercise-camera-placeholder";
import { ExerciseSelector } from "@/components/workout/exercise-selector";
import { WorkoutControls } from "@/components/workout/workout-controls";
import { LiveMetrics } from "@/components/workout/live-metrics";
import { CoachingCues } from "@/components/workout/coaching-cues";
import { MobileWorkoutHUD } from "@/components/workout/mobile-hud";
import { PostWorkoutSummary } from "@/components/workout/post-workout-summary";
import { PerfectRepBanner } from "@/components/workout/perfect-rep-banner";
import { AICoachBadge } from "@/components/workout/ai-coach-badge";
import { ExerciseManager } from "@/components/workout/exercise-manager";
import { ManualLog } from "@/components/workout/manual-log";
import { RoutineBuilder } from "@/components/workout/routine-builder";
import { RecommendedWorkouts } from "@/components/workout/recommended-workouts";
import {
  RoutineProgressBar,
  type RoutineProgressState,
} from "@/components/workout/routine-progress-bar";
import { ExerciseGuideModal } from "@/components/exercise-guide/exercise-guide-modal";
import { getExerciseGuide } from "@/lib/exercises/exercise-visual-guides";
import { getExercise } from "@/lib/exercises";
import { hasCompletedOnboarding, fetchHasCompletedOnboarding } from "@/lib/storage";
import { useWorkoutStore } from "@/lib/store";
import { UserExercise, WorkoutRoutine, RoutineExercise } from "@/types";
import { href } from "@/components/liftiq/nav-config";
import { Button, Card, Pill, Reveal } from "@/components/liftiq/primitives";
import { LogSession } from "./log-session";
import { cn } from "@/lib/utils";

type TrainMode = "camera" | "log";

export default function TrainPage() {
  const router = useRouter();
  const [mode, setMode] = useState<TrainMode>("camera");
  const {
    lastSession,
    selectedExercise,
    selectedExerciseLabel,
    isWorkoutActive,
    isRecording,
    isCountingDown,
    isFormChecking,
    sessionWeight,
    hasSelectedExercise,
    setSelectedExercise,
    setSessionWeight,
    setHasSelectedExercise,
    startCountdown,
    clearRepResults,
    setRecordingBlob,
  } = useWorkoutStore();

  const [showExerciseManager, setShowExerciseManager] = useState(false);
  const [showManualLog, setShowManualLog] = useState(false);
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false);
  const [showExerciseGuide, setShowExerciseGuide] = useState(false);
  const [ghostCoachEnabled, setGhostCoachEnabled] = useState(false);
  const [selectedUserExercise, setSelectedUserExercise] = useState<UserExercise | null>(null);
  const [routineProgress, setRoutineProgress] = useState<RoutineProgressState | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !hasCompletedOnboarding()) {
      fetchHasCompletedOnboarding().then((done) => {
        if (!done) router.push("/onboarding");
      });
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("exercise");
    if (!raw) return;
    const id = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (getExercise(id)) {
      setSelectedExercise(id);
      setSelectedUserExercise(null);
      setMode("camera");
    }
  }, [setSelectedExercise]);

  const exerciseName =
    selectedUserExercise?.name ||
    selectedExerciseLabel ||
    (selectedExercise
      ? selectedExercise
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "Choose an exercise");
  const weightLabel = selectedUserExercise?.weight ?? sessionWeight;
  const hasGuide = !!(selectedExercise && getExerciseGuide(selectedExercise));

  const handleSelectUserExercise = (ex: UserExercise) => {
    setSelectedUserExercise(ex);
    setSelectedExercise(ex.trackingId);
    setHasSelectedExercise(true);
    if (ex.weight) setSessionWeight(ex.weight);
  };

  const handleStartRoutine = (routine: WorkoutRoutine) => {
    if (routine.exercises.length === 0) return;
    const firstEx = routine.exercises[0];
    setSelectedExercise(firstEx.trackingId);
    if (firstEx.weight) setSessionWeight(firstEx.weight);
    setRoutineProgress({
      routine,
      exerciseIndex: 0,
      currentSet: 1,
      isResting: false,
      completed: false,
    });
    setHasSelectedExercise(true);
    setMode("camera");
  };

  const currentRoutineExercise: RoutineExercise | null =
    routineProgress && !routineProgress.completed
      ? routineProgress.routine.exercises[routineProgress.exerciseIndex]
      : null;

  const handleSetComplete = useCallback(() => {
    if (!routineProgress || !currentRoutineExercise) return;
    const { exerciseIndex, currentSet, routine } = routineProgress;

    if (currentSet < currentRoutineExercise.targetSets) {
      setRoutineProgress({ ...routineProgress, isResting: true });
    } else {
      const nextIdx = exerciseIndex + 1;
      if (nextIdx < routine.exercises.length) {
        const nextEx = routine.exercises[nextIdx];
        if (nextEx.trackingId !== "custom") setSelectedExercise(nextEx.trackingId);
        if (nextEx.weight) setSessionWeight(nextEx.weight);
        setRoutineProgress({
          ...routineProgress,
          exerciseIndex: nextIdx,
          currentSet: 1,
          isResting: true,
        });
      } else {
        setRoutineProgress({ ...routineProgress, completed: true, isResting: false });
      }
    }
  }, [routineProgress, currentRoutineExercise, setSelectedExercise, setSessionWeight]);

  const handleRestComplete = useCallback(() => {
    if (!routineProgress || !currentRoutineExercise) return;
    const { currentSet } = routineProgress;
    if (currentSet < currentRoutineExercise.targetSets) {
      setRoutineProgress({
        ...routineProgress,
        currentSet: currentSet + 1,
        isResting: false,
      });
    } else {
      setRoutineProgress({ ...routineProgress, isResting: false });
    }
  }, [routineProgress, currentRoutineExercise]);

  const startRecording = () => {
    clearRepResults();
    setRecordingBlob(null);
    startCountdown(true);
  };

  const toolBusy = isWorkoutActive || isCountingDown || isFormChecking;

  return (
    <div className="space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="liq-eyebrow">Train</p>
            <h1 className="liq-tight mt-1 text-[26px] font-semibold liq-t1 md:text-[30px]">
              {mode === "camera" ? "AI Camera" : "Log Workout"}
            </h1>
            <p className="mt-1.5 text-[14px] liq-t2">
              {mode === "camera"
                ? "Live pose tracking, form scoring, and rep counting from your camera."
                : "Log sets, reps, weight, and RPE by hand."}
            </p>
          </div>
          <div
            role="tablist"
            className="inline-flex items-center gap-0.5 rounded-[10px] bg-white/[0.04] p-0.5"
          >
            {(
              [
                ["camera", "AI Camera"],
                ["log", "Log Sets"],
              ] as const
            ).map(([id, label]) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                    active ? "bg-white/[0.08] text-[#f7f7f8]" : "text-[#6b7280] hover:text-[#9ca3af]",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      {mode === "log" ? (
        <LogSession />
      ) : (
        <div className="space-y-5">
          <Reveal delay={0.04}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <Pill tone={isWorkoutActive ? "accent" : "neutral"}>
                  {isWorkoutActive ? (
                    <>
                      <Radio size={11} className="animate-pulse" />
                      Live
                    </>
                  ) : (
                    <>
                      <ScanLine size={11} />
                      Ready
                    </>
                  )}
                </Pill>
                <span className="text-[14px] font-medium liq-t1">{exerciseName}</span>
                {weightLabel != null && (
                  <span className="text-[13px] liq-t3">· {weightLabel} lbs</span>
                )}
                {isRecording && (
                  <Pill tone="danger">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e0655f]" />
                    Rec
                  </Pill>
                )}
              </div>
            </div>
          </Reveal>

          {!toolBusy && (
            <Reveal delay={0.06}>
              <div className="flex flex-wrap gap-2">
                {hasGuide && (
                  <Button size="sm" onClick={() => setShowExerciseGuide(true)} title="How to do this exercise">
                    <HelpCircle size={14} /> How To
                  </Button>
                )}
                <Button size="sm" onClick={() => router.push(href("/train/live"))} title="Live workout with set logging">
                  <Timer size={14} /> Live Workout
                </Button>
                <Button size="sm" onClick={() => setShowManualLog(true)} title="Log workout without camera">
                  <NotebookPen size={14} /> Log Workout
                </Button>
                <Button size="sm" onClick={() => setShowRoutineBuilder(true)} title="Routines">
                  <LayoutList size={14} /> Routines
                </Button>
                <Button size="sm" onClick={() => setShowExerciseManager(true)} title="My exercises">
                  <ListPlus size={14} /> My Exercises
                </Button>
                <Button
                  size="sm"
                  onClick={startRecording}
                  disabled={!hasSelectedExercise || !selectedExercise}
                  title="Record workout with form analysis"
                >
                  <Video size={14} className="text-[#e0655f]" /> Record
                </Button>
              </div>
            </Reveal>
          )}

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Reveal delay={0.08}>
                <Card className="overflow-hidden p-0">
                  <div className="relative bg-[#040408]">
                    {hasSelectedExercise ? (
                      <WebcamFeed
                        ghostCoachEnabled={ghostCoachEnabled}
                        onDismissGhostCoach={() => setGhostCoachEnabled(false)}
                      />
                    ) : (
                      <ExerciseCameraPlaceholder />
                    )}
                    <div className="md:hidden">
                      <MobileWorkoutHUD />
                      <MobileCoachingToast />
                    </div>
                  </div>
                </Card>
              </Reveal>

              <Reveal delay={0.12}>
                <CoachingCues />
              </Reveal>

              <Reveal delay={0.14}>
                <Card className="p-5">
                  <WorkoutControls />
                </Card>
              </Reveal>
            </div>

            <aside className="space-y-4">
              {routineProgress && (
                <Reveal delay={0.1}>
                  <RoutineProgressBar
                    routineProgress={routineProgress}
                    onExit={() => setRoutineProgress(null)}
                    onSetComplete={handleSetComplete}
                    onRestComplete={handleRestComplete}
                    onSkipRest={handleRestComplete}
                  />
                </Reveal>
              )}

              {!routineProgress && (
                <Reveal delay={0.1}>
                  <Card className="p-5">
                    {!toolBusy && (
                      <RecommendedWorkouts
                        className="mb-4"
                        onSelect={() => setSelectedUserExercise(null)}
                      />
                    )}
                    <ExerciseSelector onSelect={() => setSelectedUserExercise(null)} />
                  </Card>
                </Reveal>
              )}

              <Reveal delay={0.16}>
                <AICoachBadge />
              </Reveal>

              <Reveal delay={0.18}>
                <LiveMetrics />
              </Reveal>
            </aside>
          </div>

          <PerfectRepBanner />
        </div>
      )}

      {lastSession && <PostWorkoutSummary />}
      {showExerciseManager && (
        <ExerciseManager
          onClose={() => setShowExerciseManager(false)}
          onSelectExercise={handleSelectUserExercise}
        />
      )}
      {showManualLog && <ManualLog onClose={() => setShowManualLog(false)} />}
      {showRoutineBuilder && (
        <RoutineBuilder
          onClose={() => setShowRoutineBuilder(false)}
          onStartRoutine={handleStartRoutine}
        />
      )}
      {showExerciseGuide && selectedExercise && getExerciseGuide(selectedExercise) && (
        <ExerciseGuideModal
          guide={getExerciseGuide(selectedExercise)!}
          exerciseName={selectedExerciseLabel || exerciseName}
          onClose={() => setShowExerciseGuide(false)}
          onEnableGhostCoach={() => setGhostCoachEnabled(true)}
        />
      )}
    </div>
  );
}

function MobileCoachingToast() {
  const { currentCues, isWorkoutActive, aiLiveCue } = useWorkoutStore();
  if (!isWorkoutActive) return null;
  const cue = aiLiveCue || currentCues[0];
  if (!cue) return null;
  const positive = cue.includes("Good") || cue.includes("Great");
  return (
    <div className="pointer-events-none absolute bottom-2 left-3 right-3 z-20 md:hidden">
      <div
        className={cn(
          "mx-auto max-w-md rounded-xl px-4 py-3 text-center text-sm font-medium",
          "border border-white/[0.08] bg-[#0b0c0f]/85 backdrop-blur-md",
          positive ? "text-emerald-300" : "text-amber-200",
        )}
      >
        {cue}
      </div>
    </div>
  );
}
