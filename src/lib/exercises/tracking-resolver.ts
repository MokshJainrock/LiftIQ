import { EXERCISE_LIBRARY, type LibraryExercise } from "@/lib/exercises/library";
import { getExercise } from "@/lib/exercises";

/** Camera AI motion templates (MediaPipe rep engines). */
export const TRACKING_TEMPLATE_IDS = [
  "squat",
  "pushup",
  "lunge",
  "plank",
  "situp",
  "jumping-jack",
  "mountain-climber",
  "shoulder-press",
  "bicep-curl",
  "burpee",
  "lateral-raise",
  "row",
  "deadlift",
  "glute-bridge",
  "tricep-dip",
  "tricep-extension",
] as const;

export type TrackingTemplateId = (typeof TRACKING_TEMPLATE_IDS)[number];

/**
 * Map a library exercise name (188 catalog) to the closest motion template
 * for rep counting + form scoring. Explicit trackingId wins when valid.
 */
export function resolveTrackingId(
  exerciseName: string,
  explicitTrackingId?: string,
): TrackingTemplateId | null {
  if (explicitTrackingId && getExercise(explicitTrackingId)) {
    return explicitTrackingId as TrackingTemplateId;
  }

  const n = exerciseName.toLowerCase();

  // ── Compound / full-body movements first ──────────────────────
  if (/burpee|man maker|sprawl|devil press/i.test(n)) return "burpee";
  if (/jumping jack|star jump|side straddle/i.test(n)) return "jumping-jack";
  if (/mountain climber|bear crawl|inchworm|plank jack/i.test(n)) return "mountain-climber";

  // ── Glute bridge / hip thrust (before the hip-hinge rule) ─────
  if (/glute bridge|hip thrust|frog pump|hip raise/i.test(n)) return "glute-bridge";

  // ── Hip hinge / posterior chain ───────────────────────────────
  if (
    /deadlift|\brdl\b|romanian|stiff.?leg|good morning|rack pull|pull.?through|kettlebell swing|\bswing\b|hip hinge/i.test(
      n,
    )
  ) {
    return "deadlift";
  }

  // ── Dips (vertical push) ──────────────────────────────────────
  if (/\bdips?\b/i.test(n)) return "tricep-dip";

  // ── Tricep elbow-extension (pushdowns, extensions, skull crushers) ─
  if (/pushdown|skull crusher|tricep.*extension|overhead.*extension|tricep kickback/i.test(n)) {
    return "tricep-extension";
  }

  // ── Push-ups ──────────────────────────────────────────────────
  if (/push.?up|pike push|handstand push|diamond push|decline push|wall push|archer push/i.test(n)) {
    return "pushup";
  }

  // ── Planks & anti-movement holds ──────────────────────────────
  if (/plank|dead bug|bird dog|hollow|side plank|pallof|copenhagen/i.test(n) && !/push/i.test(n)) {
    return "plank";
  }

  // ── Ab flexion (sit-up family) ────────────────────────────────
  if (/sit.?up|crunch|v.?up|toe touch|bicycle|leg raise(?!.*hang)|flutter kick|knee raise/i.test(n)) {
    return "situp";
  }

  // ── Shoulder raises (before rows so "upright row" lands here) ─
  if (
    /lateral raise|side raise|front raise|rear delt|reverse fly|delt fly|y.?raise|upright row|scarecrow|lateral fly/i.test(
      n,
    )
  ) {
    return "lateral-raise";
  }

  // ── Rows & pulls (skip straight-arm — no rep flexion) ─────────
  if (!/straight.?arm/i.test(n) && /\brow\b|rows|face pull|pulldown|pull.?down|pull.?up|chin.?up/i.test(n)) {
    return "row";
  }

  // ── Overhead press ────────────────────────────────────────────
  if (
    /shoulder press|overhead press|ohp|military press|arnold press|push press|landmine press|pike|thruster|clean.*press/i.test(
      n,
    )
  ) {
    return "shoulder-press";
  }

  // ── Biceps curls (exclude leg/wrist/calf "curls") ─────────────
  if (/curl/i.test(n) && !/leg curl|nordic|calf|wrist/i.test(n)) {
    return "bicep-curl";
  }

  // ── Lunges / split-stance ─────────────────────────────────────
  if (/lunge|split squat|step.?up|bulgarian|curtsy/i.test(n)) {
    return "lunge";
  }

  // ── Squats & knee-dominant ────────────────────────────────────
  if (/squat|leg press|hack squat|wall sit|goblet|front squat|box squat|sumo squat|sissy squat|pistol|jump squat/i.test(n)) {
    return "squat";
  }

  return null;
}

export interface TrackableExercise extends LibraryExercise {
  templateId: TrackingTemplateId;
}

/** All 188 library entries that can use AI camera tracking via a template. */
export function getTrackableLibraryExercises(): TrackableExercise[] {
  const out: TrackableExercise[] = [];
  for (const ex of EXERCISE_LIBRARY) {
    const templateId = resolveTrackingId(ex.name, ex.trackingId);
    if (templateId) out.push({ ...ex, templateId });
  }
  return out;
}

export function countTrackableExercises(): number {
  return getTrackableLibraryExercises().length;
}
