// Per-exercise demo configuration: unique pose + visible equipment props.

import type { Equipment, LibraryExercise } from "@/lib/exercises/library";
import { findLibraryByKey, findLibraryExerciseByName } from "@/lib/exercises/library";

export type DemoPosition = "standing" | "seated" | "lying" | "incline" | "kneeling" | "floor" | "hanging";

export type DemoEquipment =
  | { type: "barbell" }
  | { type: "dumbbell"; single?: boolean }
  | { type: "cable"; anchor: "high" | "low" | "mid" }
  | { type: "machine"; variant: "press" | "leg-press" | "pec-deck" | "row" | "leg-ext" | "leg-curl" | "calf" | "hack-squat" }
  | { type: "kettlebell" }
  | { type: "pull-up-bar" }
  | { type: "band"; anchor: "floor" | "high" }
  | { type: "bodyweight" }
  | { type: "cardio" };

/** Unique pose animation — each ID has its own keyframes in demo-poses.ts */
export type DemoPoseId =
  | "curl-standing"
  | "curl-preacher"
  | "curl-concentration"
  | "curl-spider"
  | "press-ohp"
  | "press-bench"
  | "press-incline"
  | "press-machine"
  | "fly-dumbbell"
  | "fly-cable"
  | "fly-pec-deck"
  | "pushup"
  | "dip"
  | "row-bent"
  | "row-single"
  | "row-seated-cable"
  | "row-machine"
  | "pulldown"
  | "pulldown-straight-arm"
  | "pullup"
  | "inverted-row"
  | "deadlift"
  | "good-morning"
  | "squat-back"
  | "squat-goblet"
  | "leg-press"
  | "hack-squat"
  | "leg-extension"
  | "leg-curl-lying"
  | "leg-curl-seated"
  | "lunge"
  | "step-up"
  | "wall-sit"
  | "tricep-pushdown"
  | "tricep-overhead"
  | "tricep-skull"
  | "tricep-kickback"
  | "tricep-machine"
  | "lateral-raise"
  | "front-raise"
  | "rear-delt-fly"
  | "face-pull"
  | "upright-row"
  | "hip-thrust"
  | "glute-bridge"
  | "hip-abduction"
  | "donkey-kick"
  | "calf-raise"
  | "wrist-curl"
  | "farmer-walk"
  | "dead-hang"
  | "plank"
  | "side-plank"
  | "crunch"
  | "situp"
  | "leg-raise-hanging"
  | "leg-raise-lying"
  | "ab-wheel"
  | "mountain-climber"
  | "russian-twist"
  | "burpee"
  | "jumping-jack"
  | "box-jump"
  | "kettlebell-swing"
  | "kettlebell-press"
  | "landmine-press"
  | "pike-pushup"
  | "superman"
  | "suitcase-carry"
  | "cardio-row"
  | "cardio-run";

export interface ExerciseDemoSpec {
  poseId: DemoPoseId;
  equipment: DemoEquipment;
  position: DemoPosition;
  /** Prefer front view for bilateral dumbbell/cable moves. */
  preferFront?: boolean;
}

function cableAnchor(name: string): "high" | "low" | "mid" {
  const n = name.toLowerCase();
  if (/low-to-high|leg curl|kickback|glute|pull-through|woodchopper|deadlift.*band/i.test(n)) return "low";
  if (/pushdown|tricep push|straight-arm|face pull|pulldown|pull-down|crunch|lat pull/i.test(n)) return "high";
  return "mid";
}

function machineVariant(name: string, muscle: string): DemoEquipment & { type: "machine" } {
  const n = name.toLowerCase();
  if (/leg press|leg-press/i.test(n)) return { type: "machine", variant: "leg-press" };
  if (/pec deck|fly.*machine/i.test(n)) return { type: "machine", variant: "pec-deck" };
  if (/leg extension/i.test(n)) return { type: "machine", variant: "leg-ext" };
  if (/leg curl|glute-ham|nordic/i.test(n)) return { type: "machine", variant: "leg-curl" };
  if (/calf|hack squat/i.test(n)) return { type: "machine", variant: n.includes("hack") ? "hack-squat" : "calf" };
  if (/row/i.test(n)) return { type: "machine", variant: "row" };
  return { type: "machine", variant: "press" };
}

function equipFromLibrary(ex: LibraryExercise): DemoEquipment {
  switch (ex.equipment) {
    case "barbell":
      return { type: "barbell" };
    case "dumbbell":
      return { type: "dumbbell", single: /single|one-arm|concentration|kickback|renegade|pistol|suitcase/i.test(ex.name) };
    case "cable":
      return { type: "cable", anchor: cableAnchor(ex.name) };
    case "machine":
      return machineVariant(ex.name, ex.muscle);
    case "kettlebell":
      return { type: "kettlebell" };
    case "band":
      return { type: "band", anchor: /curl|press|walk|lateral/i.test(ex.name) ? "floor" : "high" };
    case "cardio":
      return { type: "cardio" };
    default:
      return { type: "bodyweight" };
  }
}

/** Resolve the exact pose + equipment for a library exercise. */
export function resolveDemoSpec(ex: LibraryExercise): ExerciseDemoSpec {
  const n = ex.name.toLowerCase();
  const eq = equipFromLibrary(ex);

  // ── Name-specific poses (most accurate) ──
  if (/preacher curl|ez-bar curl/i.test(n))
    return { poseId: "curl-preacher", equipment: eq.type === "dumbbell" ? eq : { type: "barbell" }, position: "seated" };
  if (/concentration curl/i.test(n))
    return { poseId: "curl-concentration", equipment: { type: "dumbbell", single: true }, position: "seated" };
  if (/spider curl/i.test(n))
    return { poseId: "curl-spider", equipment: { type: "dumbbell" }, position: "incline" };

  if (/incline bench|incline dumbbell press|incline push/i.test(n))
    return { poseId: "press-incline", equipment: eq, position: "incline", preferFront: eq.type === "dumbbell" };
  if (/bench press|close-grip bench|decline bench|dumbbell bench|svend|machine.*bench|machine chest press|machine incline/i.test(n))
    return { poseId: /decline/i.test(n) ? "press-bench" : "press-bench", equipment: eq, position: "lying" };
  if (/pec deck/i.test(n))
    return { poseId: "fly-pec-deck", equipment: { type: "machine", variant: "pec-deck" }, position: "seated", preferFront: true };
  if (/fly|pullover/i.test(n))
    return { poseId: eq.type === "cable" ? "fly-cable" : "fly-dumbbell", equipment: eq, position: "standing", preferFront: true };

  if (/push-up|push up|diamond push/i.test(n))
    return { poseId: "pushup", equipment: { type: "bodyweight" }, position: "floor" };
  if (/pike push|handstand push/i.test(n))
    return { poseId: "pike-pushup", equipment: { type: "bodyweight" }, position: "floor" };
  if (/dip/i.test(n))
    return { poseId: "dip", equipment: { type: "bodyweight" }, position: "standing" };

  if (/lat pulldown|pull-down|band pull-down|single-arm lat/i.test(n))
    return { poseId: "pulldown", equipment: eq.type === "cable" ? eq : { type: "cable", anchor: "high" }, position: "seated" };
  if (/straight-arm pulldown/i.test(n))
    return { poseId: "pulldown-straight-arm", equipment: { type: "cable", anchor: "high" }, position: "standing" };
  if (/pull-up|chin-up|pull up|chin up|toes to bar|hanging leg|hanging knee|dead hang/i.test(n))
    return { poseId: /dead hang/i.test(n) ? "dead-hang" : "pullup", equipment: { type: "pull-up-bar" }, position: "hanging" };
  if (/inverted row/i.test(n))
    return { poseId: "inverted-row", equipment: { type: "bodyweight" }, position: "lying" };

  if (/seated cable row|machine row|chest-supported|seal row/i.test(n))
    return { poseId: /machine row/i.test(n) ? "row-machine" : "row-seated-cable", equipment: eq, position: /chest-supported|seal/i.test(n) ? "incline" : "seated" };
  if (/renegade|meadows|dumbbell row|single.*row/i.test(n))
    return { poseId: "row-single", equipment: { type: "dumbbell", single: true }, position: "floor" };
  if (/row|pendlay|t-bar/i.test(n))
    return { poseId: "row-bent", equipment: eq.type === "dumbbell" ? { type: "dumbbell", single: true } : { type: "barbell" }, position: "standing" };

  if (/leg press|leg-press calf/i.test(n))
    return { poseId: "leg-press", equipment: { type: "machine", variant: "leg-press" }, position: "seated" };
  if (/hack squat/i.test(n))
    return { poseId: "hack-squat", equipment: { type: "machine", variant: "hack-squat" }, position: "standing" };
  if (/leg extension/i.test(n))
    return { poseId: "leg-extension", equipment: { type: "machine", variant: "leg-ext" }, position: "seated" };
  if (/lying leg curl|nordic|glute-ham/i.test(n))
    return { poseId: "leg-curl-lying", equipment: eq, position: "floor" };
  if (/seated leg curl/i.test(n))
    return { poseId: "leg-curl-seated", equipment: { type: "machine", variant: "leg-curl" }, position: "seated" };

  if (/front squat|goblet squat/i.test(n))
    return { poseId: "squat-goblet", equipment: eq, position: "standing" };
  if (/back squat|bodyweight squat|jump squat|sissy|pistol|wall sit/i.test(n))
    return { poseId: /wall sit/i.test(n) ? "wall-sit" : "squat-back", equipment: eq, position: "standing" };
  if (/lunge|split squat|curtsy|walking lunge|bulgarian/i.test(n))
    return { poseId: "lunge", equipment: eq, position: "standing" };
  if (/step-up/i.test(n))
    return { poseId: "step-up", equipment: eq, position: "standing" };

  if (/deadlift|rack pull|sumo dead/i.test(n))
    return { poseId: "deadlift", equipment: { type: "barbell" }, position: "standing" };
  if (/rdl|romanian|stiff-leg|good morning|single-leg rdl|dumbbell rdl/i.test(n))
    return { poseId: /good morning/i.test(n) ? "good-morning" : "deadlift", equipment: eq, position: "standing" };

  if (/hip thrust/i.test(n))
    return { poseId: "hip-thrust", equipment: eq, position: "lying" };
  if (/glute bridge|frog pump/i.test(n))
    return { poseId: "glute-bridge", equipment: { type: "bodyweight" }, position: "lying" };
  if (/hip abduction|reverse hyper|donkey kick|banded lateral walk/i.test(n))
    return { poseId: /donkey kick/i.test(n) ? "donkey-kick" : "hip-abduction", equipment: eq, position: "floor" };
  if (/cable kickback|pull-through/i.test(n))
    return { poseId: "donkey-kick", equipment: { type: "cable", anchor: "low" }, position: "floor" };

  if (/tricep pushdown|rope pushdown/i.test(n))
    return { poseId: "tricep-pushdown", equipment: { type: "cable", anchor: "high" }, position: "standing" };
  if (/skull crusher/i.test(n))
    return { poseId: "tricep-skull", equipment: { type: "barbell" }, position: "lying" };
  if (/overhead tricep|cable overhead extension/i.test(n))
    return { poseId: "tricep-overhead", equipment: eq, position: "standing" };
  if (/kickback|machine tricep/i.test(n))
    return { poseId: "tricep-kickback", equipment: eq, position: "standing" };

  if (/lateral raise|y-raise/i.test(n))
    return { poseId: "lateral-raise", equipment: eq, position: "standing", preferFront: true };
  if (/front raise|plate front/i.test(n))
    return { poseId: "front-raise", equipment: eq, position: "standing" };
  if (/rear delt|reverse fly/i.test(n))
    return { poseId: "rear-delt-fly", equipment: eq, position: "standing", preferFront: true };
  if (/face pull/i.test(n))
    return { poseId: "face-pull", equipment: { type: "cable", anchor: "high" }, position: "standing" };
  if (/upright row/i.test(n))
    return { poseId: "upright-row", equipment: { type: "barbell" }, position: "standing" };
  if (/landmine press/i.test(n))
    return { poseId: "landmine-press", equipment: { type: "barbell" }, position: "standing" };
  if (/overhead press|shoulder press|arnold|push press|machine shoulder/i.test(n))
    return { poseId: eq.type === "machine" ? "press-machine" : "press-ohp", equipment: eq, position: eq.type === "machine" ? "seated" : "standing", preferFront: eq.type === "dumbbell" };

  if (/curl|hammer|zottman|band curl/i.test(n))
    return { poseId: "curl-standing", equipment: eq, position: "standing", preferFront: eq.type === "dumbbell" };

  if (/wrist curl|reverse curl|pinch/i.test(n))
    return { poseId: "wrist-curl", equipment: eq, position: "seated" };
  if (/farmer walk/i.test(n))
    return { poseId: "farmer-walk", equipment: { type: "dumbbell" }, position: "standing", preferFront: true };

  if (/calf raise|tibialis/i.test(n))
    return { poseId: "calf-raise", equipment: eq, position: "standing" };

  if (/plank shoulder|plank(?!.*side)/i.test(n))
    return { poseId: "plank", equipment: { type: "bodyweight" }, position: "floor" };
  if (/side plank|copenhagen/i.test(n))
    return { poseId: "side-plank", equipment: { type: "bodyweight" }, position: "floor" };
  if (/sit-up|sit up/i.test(n))
    return { poseId: "situp", equipment: { type: "bodyweight" }, position: "lying" };
  if (/crunch|dead bug|bird dog|hollow body/i.test(n))
    return { poseId: "crunch", equipment: { type: "bodyweight" }, position: "lying" };
  if (/russian twist|flutter|v-up|leg raise(?!.*hanging)/i.test(n))
    return { poseId: "leg-raise-lying", equipment: { type: "bodyweight" }, position: "lying" };
  if (/ab wheel|rollout/i.test(n))
    return { poseId: "ab-wheel", equipment: { type: "bodyweight" }, position: "kneeling" };
  if (/mountain climber/i.test(n))
    return { poseId: "mountain-climber", equipment: { type: "bodyweight" }, position: "floor" };
  if (/cable crunch|woodchopper|pallof|suitcase carry/i.test(n))
    return { poseId: /suitcase/i.test(n) ? "suitcase-carry" : "crunch", equipment: eq, position: /suitcase/i.test(n) ? "standing" : "kneeling" };
  if (/superman/i.test(n))
    return { poseId: "superman", equipment: { type: "bodyweight" }, position: "lying" };

  if (/burpee|bear crawl|shuttle|shadow box|high knee|sprint/i.test(n))
    return { poseId: "burpee", equipment: { type: "bodyweight" }, position: "floor" };
  if (/jumping jack/i.test(n))
    return { poseId: "jumping-jack", equipment: { type: "bodyweight" }, position: "standing", preferFront: true };
  if (/box jump/i.test(n))
    return { poseId: "box-jump", equipment: { type: "bodyweight" }, position: "standing" };
  if (/row(ing)? machine|ski erg|assault bike|elliptical|treadmill|stair|cycling|swim|incline walk|jump rope/i.test(n))
    return { poseId: /row|ski/i.test(n) ? "cardio-row" : "cardio-run", equipment: { type: "cardio" }, position: "seated" };

  if (/kettlebell swing|clean|snatch|thruster|man maker|devil press|get-up|carry/i.test(n))
    return { poseId: /swing/i.test(n) ? "kettlebell-swing" : "kettlebell-press", equipment: { type: "kettlebell" }, position: "standing" };
  if (/clean & jerk|snatch|thruster|sled push|battle rope|band pull|resistance band row/i.test(n))
    return { poseId: "squat-back", equipment: eq, position: "standing" };

  // ── Muscle + equipment fallback ──
  const preferFront = eq.type === "dumbbell" && !("single" in eq && eq.single);
  if (ex.muscle === "biceps" || ex.muscle === "forearms")
    return { poseId: "curl-standing", equipment: eq, position: "standing", preferFront };
  if (ex.muscle === "triceps")
    return { poseId: "tricep-pushdown", equipment: eq, position: "standing" };
  if (ex.muscle === "chest")
    return { poseId: eq.type === "machine" ? "press-machine" : "press-bench", equipment: eq, position: eq.type === "bodyweight" ? "floor" : "lying" };
  if (ex.muscle === "back")
    return { poseId: eq.type === "cable" ? "row-seated-cable" : "row-bent", equipment: eq, position: "standing" };
  if (ex.muscle === "shoulders")
    return { poseId: "press-ohp", equipment: eq, position: "standing", preferFront };
  if (["quads", "glutes", "hamstrings", "calves"].includes(ex.muscle))
    return { poseId: "squat-back", equipment: eq, position: "standing" };
  if (ex.muscle === "core")
    return { poseId: "crunch", equipment: { type: "bodyweight" }, position: "lying" };
  if (ex.muscle === "cardio")
    return { poseId: "cardio-run", equipment: { type: "cardio" }, position: "standing" };

  return { poseId: "curl-standing", equipment: eq, position: "standing" };
}

export function resolveDemoSpecForExercise(exerciseId?: string, exerciseName?: string): ExerciseDemoSpec {
  const lib =
    (exerciseId ? findLibraryByKey(exerciseId) : undefined) ??
    (exerciseName ? findLibraryExerciseByName(exerciseName) : undefined);
  if (lib) return resolveDemoSpec(lib);
  // Custom exercise — infer from name string only
  const fake: LibraryExercise = {
    id: exerciseId ?? "custom",
    name: exerciseName ?? "Exercise",
    muscle: "full-body",
    equipment: "bodyweight",
    defaultRestSec: 90,
    isWeighted: false,
    cue: "",
  };
  return resolveDemoSpec(fake);
}
