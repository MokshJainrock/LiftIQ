// Personalized workout recommendations — deterministic heuristics over the
// user's local session history and profile. No network calls; safe to run on
// every render of the workout page.

import { getSessions, getUserProfile } from "@/lib/storage";
import { getExercise } from "@/lib/exercises";
import type { WorkoutSession } from "@/types";

export interface WorkoutRecommendation {
  exerciseId: string;
  name: string;
  /** Short human reason shown as a chip, e.g. "Legs untrained for 6 days". */
  reason: string;
  kind: "balance" | "form" | "goal" | "progress" | "start";
}

const MUSCLE_GROUPS: Record<string, string[]> = {
  legs: ["squat", "lunge"],
  push: ["pushup", "shoulder-press"],
  core: ["plank", "situp", "mountain-climber"],
  arms: ["bicep-curl"],
  cardio: ["jumping-jack", "burpee"],
};

const GROUP_LABEL: Record<string, string> = {
  legs: "Legs",
  push: "Push",
  core: "Core",
  arms: "Arms",
  cardio: "Cardio",
};

const MS_DAY = 86400000;

function displayName(id: string): string {
  return getExercise(id)?.name ?? id;
}

function avgRecentScore(sessions: WorkoutSession[], exerciseId: string): number | null {
  const recent = sessions.filter((s) => s.exercise === exerciseId && s.reps.length > 0).slice(0, 3);
  if (recent.length === 0) return null;
  return Math.round(recent.reduce((sum, s) => sum + s.totalScore, 0) / recent.length);
}

export function getWorkoutRecommendations(): WorkoutRecommendation[] {
  const sessions = getSessions(); // newest first
  const profile = getUserProfile();
  const recs: WorkoutRecommendation[] = [];
  const used = new Set<string>();

  const push = (rec: WorkoutRecommendation) => {
    if (used.has(rec.exerciseId) || recs.length >= 3) return;
    used.add(rec.exerciseId);
    recs.push(rec);
  };

  if (sessions.length === 0) {
    // Cold start: approachable defaults.
    push({ exerciseId: "squat", name: displayName("squat"), reason: "Great first exercise to learn the tracker", kind: "start" });
    push({ exerciseId: "pushup", name: displayName("pushup"), reason: "Builds upper-body strength, no equipment", kind: "start" });
    push({ exerciseId: "jumping-jack", name: displayName("jumping-jack"), reason: "Easy warm-up to get moving", kind: "start" });
    return recs;
  }

  const now = Date.now();
  const lastTrainedByExercise = new Map<string, number>();
  for (const s of sessions) {
    if (!lastTrainedByExercise.has(s.exercise)) lastTrainedByExercise.set(s.exercise, s.startTime);
  }

  // 1) Progressive overload — strong recent score on a weighted exercise.
  for (const s of sessions.slice(0, 10)) {
    if (typeof s.weight === "number" && s.weight > 0 && s.totalScore >= 85 && s.reps.length >= 5) {
      push({
        exerciseId: s.exercise,
        name: s.exerciseName || displayName(s.exercise),
        reason: `Scored ${s.totalScore} at ${s.weight} lbs — try ${s.weight + 5} lbs`,
        kind: "progress",
      });
      break;
    }
  }

  // 2) Muscle-group balance — group trained least recently (or never).
  let staleGroup: { group: string; lastTrained: number } | null = null;
  for (const [group, ids] of Object.entries(MUSCLE_GROUPS)) {
    const lastTimes = ids
      .map((id) => lastTrainedByExercise.get(id))
      .filter((t): t is number => typeof t === "number");
    const last = lastTimes.length > 0 ? Math.max(...lastTimes) : 0;
    if (!staleGroup || last < staleGroup.lastTrained) {
      staleGroup = { group, lastTrained: last };
    }
  }
  if (staleGroup) {
    const ids = MUSCLE_GROUPS[staleGroup.group];
    // Prefer an exercise in the group the user has done before; else first.
    const pick = ids.find((id) => lastTrainedByExercise.has(id)) ?? ids[0];
    const days = staleGroup.lastTrained > 0 ? Math.floor((now - staleGroup.lastTrained) / MS_DAY) : null;
    push({
      exerciseId: pick,
      name: displayName(pick),
      reason:
        days === null
          ? `${GROUP_LABEL[staleGroup.group]} — never trained yet`
          : days >= 1
            ? `${GROUP_LABEL[staleGroup.group]} untrained for ${days} day${days === 1 ? "" : "s"}`
            : `Balance out today with ${GROUP_LABEL[staleGroup.group].toLowerCase()}`,
      kind: "balance",
    });
  }

  // 3) Form focus — trained exercise with the weakest recent average score.
  let weakest: { id: string; score: number } | null = null;
  for (const id of lastTrainedByExercise.keys()) {
    const score = avgRecentScore(sessions, id);
    if (score !== null && score < 80 && (!weakest || score < weakest.score)) {
      weakest = { id, score };
    }
  }
  if (weakest) {
    push({
      exerciseId: weakest.id,
      name: displayName(weakest.id),
      reason: `Recent avg ${weakest.score}/100 — sharpen your form`,
      kind: "form",
    });
  }

  // 4) Goal alignment — fill remaining slot from the user's weight goal.
  const goal = profile?.weightGoal;
  if (goal === "lose") {
    push({ exerciseId: "burpee", name: displayName("burpee"), reason: "Highest calorie burn for your goal", kind: "goal" });
    push({ exerciseId: "jumping-jack", name: displayName("jumping-jack"), reason: "Cardio boost for your goal", kind: "goal" });
  } else if (goal === "gain") {
    push({ exerciseId: "squat", name: displayName("squat"), reason: "Big compound lift for muscle gain", kind: "goal" });
    push({ exerciseId: "shoulder-press", name: displayName("shoulder-press"), reason: "Strength work for your goal", kind: "goal" });
  } else {
    push({ exerciseId: "plank", name: displayName("plank"), reason: "Core stability rounds out your week", kind: "goal" });
  }

  return recs;
}
