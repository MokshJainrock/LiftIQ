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

  if (/burpee|man maker|sprawl/i.test(n)) return "burpee";
  if (/jumping jack|star jump|side straddle/i.test(n)) return "jumping-jack";
  if (/mountain climber|bear crawl|inchworm|plank jack/i.test(n)) return "mountain-climber";
  if (/push.?up|pike push|handstand push|diamond push|decline push|wall push|archer push/i.test(n)) {
    return "pushup";
  }
  if (/plank|dead bug|bird dog|hollow hold|side plank|pallof/i.test(n) && !/push/i.test(n)) {
    return "plank";
  }
  if (/sit.?up|crunch|v.?up|toe touch|bicycle crunch|leg raise(?!.*hang)/i.test(n)) {
    return "situp";
  }
  if (/curl|hammer curl|preacher|concentration curl|spider curl|drag curl/i.test(n)) {
    return "bicep-curl";
  }
  if (/shoulder press|overhead press|ohp|military press|arnold press|push press|landmine press|pike/i.test(n)) {
    return "shoulder-press";
  }
  if (/lunge|split squat|step.?up|bulgarian|walking lunge|reverse lunge/i.test(n)) {
    return "lunge";
  }
  if (/squat|leg press|hack squat|wall sit|goblet squat|front squat|box squat|sumo squat|sissy squat/i.test(n)) {
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
