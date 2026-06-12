// Maps every library exercise to the closest animated demo guide so
// barbell curl shows a curl, bench press shows a press, etc.

import { findLibraryByKey, findLibraryExerciseByName, LibraryExercise } from "@/lib/exercises/library";
import { getExerciseGuide, type ExerciseVisualGuide } from "@/lib/exercises/exercise-visual-guides";

/** Scale frame durations so one full loop ≈ 12 seconds. */
export function normalizeLoopDuration(guide: ExerciseVisualGuide, targetMs = 12_000): ExerciseVisualGuide {
  const total = guide.frameDurations.reduce((a, b) => a + b, 0);
  if (total <= 0 || Math.abs(total - targetMs) < 500) return guide;
  const scale = targetMs / total;
  return { ...guide, frameDurations: guide.frameDurations.map((d) => Math.round(d * scale)) };
}

function byKeywords(name: string, rules: [RegExp, string][]): string | undefined {
  const n = name.toLowerCase();
  for (const [re, key] of rules) {
    if (re.test(n)) return key;
  }
  return undefined;
}

function resolveDemoKey(exercise: LibraryExercise | undefined, name: string): string {
  if (exercise?.trackingId && getExerciseGuide(exercise.trackingId)) return exercise.trackingId;

  const n = name.toLowerCase();

  const key =
    byKeywords(n, [
      [/barbell curl|dumbbell curl|hammer curl|preacher|concentration|ez-bar curl|spider curl|zottman|band curl|rope hammer|incline.*curl/, "bicep-curl"],
      [/bench press|incline bench|decline bench|chest press|pec deck|fly|push-up|push up|dip \(chest\)|svend/, "bench-press"],
      [/overhead press|shoulder press|arnold|push press|pike push|landmine press|machine shoulder|upright row|y-raise|front raise|handstand push/, "shoulder-press"],
      [/lateral raise|rear delt|face pull|shrug/, "lateral-raise"],
      [/squat|leg press|hack squat|goblet|wall sit|box jump|jump squat|sissy|pistol/, "squat"],
      [/lunge|split squat|step-up|curtsy|walking lunge|bulgarian/, "lunge"],
      [/deadlift|rdl|romanian|stiff-leg|good morning|hip thrust|glute bridge|pull-through|sumo dead|kettlebell swing/, "deadlift"],
      [/row|pulldown|pull-up|chin-up|pull up|inverted row|meadows|renegade|lat pull|straight-arm|seal row|band pull-down/, "barbell-row"],
      [/skull crusher|tricep|pushdown|overhead tricep|bench dip|diamond push|close-grip bench/, "tricep-extension"],
      [/plank|dead bug|hollow|side plank|bird dog|copenhagen|pallof|woodchopper|suitcase carry/, "plank"],
      [/sit-up|sit up|crunch|bicycle|russian twist|leg raise|v-up|flutter|ab wheel|toes to bar|hanging|mountain climber/, "situp"],
      [/burpee|jumping jack|high knee|sprint|run|bike|rower|assault|stair|elliptical|swim|ski erg|shadow box|bear crawl|shuttle|battle rope|skip rope|jump rope/, "burpee"],
      [/curl(?!.*leg)|forearm|wrist|farmer|dead hang|pinch/, "bicep-curl"],
      [/calf|tibialis/, "squat"],
      [/leg curl|leg extension|hip abduction|donkey kick|frog pump|reverse hyper|nordic|glute-ham/, "lunge"],
    ]) ?? (exercise?.equipment === "cardio" ? "burpee" : undefined);

  if (key && getExerciseGuide(key)) return key;

  // Equipment + muscle fallbacks
  if (exercise) {
    if (exercise.muscle === "cardio") return "burpee";
    if (exercise.muscle === "core") return "plank";
    if (exercise.muscle === "biceps" || exercise.muscle === "forearms") return "bicep-curl";
    if (exercise.muscle === "triceps") return "tricep-extension";
    if (exercise.muscle === "chest") return "bench-press";
    if (exercise.muscle === "back") return "barbell-row";
    if (exercise.muscle === "shoulders") return "shoulder-press";
    if (["quads", "glutes", "hamstrings", "calves"].includes(exercise.muscle)) return "squat";
  }

  return "shoulder-press";
}

export function resolveDemoGuide(exerciseId?: string, exerciseName?: string): ExerciseVisualGuide {
  const lib =
    (exerciseId ? findLibraryByKey(exerciseId) : undefined) ??
    (exerciseName ? findLibraryExerciseByName(exerciseName) : undefined);

  const key = resolveDemoKey(lib, exerciseName ?? lib?.name ?? exerciseId ?? "exercise");
  const guide = getExerciseGuide(key) ?? getExerciseGuide("squat")!;
  return normalizeLoopDuration({ ...guide, name: lib?.name ?? exerciseName ?? guide.name });
}
