// Groups individual exercise sessions into named full workouts for history UI.

import { WorkoutLog, WorkoutSession } from "@/types";

export interface WorkoutGroup {
  id: string;
  name: string;
  date: string;
  startTime: number;
  endTime: number;
  sessions: WorkoutSession[];
  totalReps: number;
  totalVolume: number;
  avgScore: number;
  exerciseCount: number;
  hasManual: boolean;
  hasCamera: boolean;
}

const CLUSTER_MS = 4 * 60 * 60 * 1000; // legacy: sessions within 4h = one workout

function sessionVolume(s: WorkoutSession): number {
  if (s.sets?.length) return s.sets.reduce((n, st) => n + (st.weight ?? 0) * st.reps, 0);
  return (s.weight ?? 0) * s.reps.length;
}

function defaultName(sessions: WorkoutSession[], date: string): string {
  const muscles = new Set<string>();
  for (const s of sessions) {
    const n = (s.exerciseName || s.exercise).toLowerCase();
    if (/squat|lunge|leg|calf|hip|glute|quad|hamstring/.test(n)) muscles.add("Legs");
    else if (/bench|press|fly|push|chest|dip/.test(n)) muscles.add("Chest");
    else if (/row|pull|lat|deadlift|back/.test(n)) muscles.add("Back");
    else if (/shoulder|raise|press|overhead/.test(n)) muscles.add("Shoulders");
    else if (/curl|bicep|tricep|arm/.test(n)) muscles.add("Arms");
    else if (/plank|crunch|sit|core|ab/.test(n)) muscles.add("Core");
    else if (/run|bike|cardio|jump|burpee/.test(n)) muscles.add("Cardio");
  }
  if (muscles.size > 0) return [...muscles].slice(0, 2).join(" & ");
  return `Workout · ${new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function toGroup(
  id: string,
  name: string,
  date: string,
  sessions: WorkoutSession[],
): WorkoutGroup {
  const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime);
  const totalReps = sorted.reduce((n, s) => n + s.reps.length, 0);
  const totalVolume = sorted.reduce((n, s) => n + sessionVolume(s), 0);
  const avgScore =
    sorted.length > 0 ? Math.round(sorted.reduce((n, s) => n + s.totalScore, 0) / sorted.length) : 0;
  return {
    id,
    name,
    date,
    startTime: sorted[0]?.startTime ?? 0,
    endTime: sorted[sorted.length - 1]?.endTime ?? sorted[sorted.length - 1]?.startTime ?? 0,
    sessions: sorted,
    totalReps,
    totalVolume,
    avgScore,
    exerciseCount: sorted.length,
    hasManual: sorted.some((s) => s.source === "manual"),
    hasCamera: sorted.some((s) => s.source !== "manual"),
  };
}

/** Build display groups from sessions + saved workout metadata. */
export function buildWorkoutGroups(sessions: WorkoutSession[], logs: WorkoutLog[]): WorkoutGroup[] {
  const logById = new Map(logs.map((l) => [l.id, l]));
  const withId = new Map<string, WorkoutSession[]>();
  const orphan: WorkoutSession[] = [];

  for (const s of sessions) {
    if (s.workoutId) {
      const list = withId.get(s.workoutId) ?? [];
      list.push(s);
      withId.set(s.workoutId, list);
    } else {
      orphan.push(s);
    }
  }

  const groups: WorkoutGroup[] = [];

  for (const [id, list] of withId) {
    const log = logById.get(id);
    const date = log?.date ?? new Date(list[0].startTime).toISOString().slice(0, 10);
    const name = log?.name || defaultName(list, date);
    groups.push(toGroup(id, name, date, list));
  }

  // Legacy sessions: cluster by date + time gap
  orphan.sort((a, b) => a.startTime - b.startTime);
  let cluster: WorkoutSession[] = [];
  let clusterDate = "";

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const id = `legacy-${clusterDate}__${cluster[0].startTime}`;
    groups.push(toGroup(id, defaultName(cluster, clusterDate), clusterDate, cluster));
    cluster = [];
  };

  for (const s of orphan) {
    const date = new Date(s.startTime).toISOString().slice(0, 10);
    if (
      cluster.length > 0 &&
      (date !== clusterDate || s.startTime - cluster[cluster.length - 1].startTime > CLUSTER_MS)
    ) {
      flushCluster();
    }
    clusterDate = date;
    cluster.push(s);
  }
  flushCluster();

  return groups.sort((a, b) => b.startTime - a.startTime);
}

export function formatWorkoutDate(date: string, startTime: number): string {
  return new Date(startTime).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
