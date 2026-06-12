// Unique skeleton pose templates — each DemoPoseId maps to distinct keyframes.

import type { ExerciseVisualGuide, PoseFrame } from "@/lib/exercises/exercise-visual-guides";
import { getExerciseGuide } from "@/lib/exercises/exercise-visual-guides";
import type { DemoPoseId } from "@/lib/exercises/demo-spec";

const SIDE = [
  ["head", "shoulder"],
  ["shoulder", "elbow"],
  ["elbow", "hand"],
  ["shoulder", "hip"],
  ["hip", "frontKnee"],
  ["frontKnee", "frontAnkle"],
  ["hip", "backKnee"],
  ["backKnee", "backAnkle"],
] as [string, string][];

const FRONT = [
  ["head", "leftShoulder"],
  ["head", "rightShoulder"],
  ["leftShoulder", "rightShoulder"],
  ["leftShoulder", "leftElbow"],
  ["leftElbow", "leftHand"],
  ["rightShoulder", "rightElbow"],
  ["rightElbow", "rightHand"],
  ["leftShoulder", "leftHip"],
  ["rightShoulder", "rightHip"],
  ["leftHip", "rightHip"],
  ["leftHip", "leftKnee"],
  ["leftKnee", "leftAnkle"],
  ["rightHip", "rightKnee"],
  ["rightKnee", "rightAnkle"],
] as [string, string][];

const LEGS = {
  hip: { x: 150, y: 132 },
  frontKnee: { x: 152, y: 192 },
  frontAnkle: { x: 152, y: 252 },
  backKnee: { x: 148, y: 192 },
  backAnkle: { x: 148, y: 252 },
};

function pose(base: Partial<PoseFrame>, arms: Partial<PoseFrame>): PoseFrame {
  return {
    head: { x: 150, y: 30 },
    shoulder: { x: 148, y: 68 },
    elbow: { x: 148, y: 100 },
    hand: { x: 148, y: 128 },
    ...LEGS,
    ...base,
    ...arms,
  } as PoseFrame;
}

function miniGuide(
  id: string,
  name: string,
  keyframes: PoseFrame[],
  opts: Partial<ExerciseVisualGuide> = {},
): ExerciseVisualGuide {
  const base = getExerciseGuide("squat")!;
  return {
    ...base,
    id,
    name,
    description: opts.description ?? name,
    muscles: opts.muscles ?? base.muscles,
    connections: SIDE,
    highlightJoints: opts.highlightJoints ?? ["shoulder", "elbow"],
    frameDurations: opts.frameDurations ?? [700, 500, 500, 700],
    keyframes,
    steps: opts.steps ?? [{ title: name, detail: "" }],
    commonMistakes: opts.commonMistakes ?? [],
    coachingCues: opts.coachingCues ?? [],
    recommendedView: opts.recommendedView ?? "side",
    frontConnections: opts.frontKeyframes ? FRONT : undefined,
    frontKeyframes: opts.frontKeyframes,
    frontHighlightJoints: opts.frontHighlightJoints,
  };
}

// ── Unique pose definitions ────────────────────────────────────

const curlStanding = getExerciseGuide("bicep-curl")!;

const curlPreacher = miniGuide("curl-preacher", "Preacher Curl", [
  pose({ head: { x: 150, y: 48 }, shoulder: { x: 145, y: 88 }, hip: { x: 148, y: 148 } }, { elbow: { x: 152, y: 118 }, hand: { x: 168, y: 138 } }),
  pose({ head: { x: 150, y: 48 }, shoulder: { x: 145, y: 88 }, hip: { x: 148, y: 148 } }, { elbow: { x: 155, y: 118 }, hand: { x: 172, y: 100 } }),
  pose({ head: { x: 150, y: 48 }, shoulder: { x: 145, y: 88 }, hip: { x: 148, y: 148 } }, { elbow: { x: 158, y: 118 }, hand: { x: 175, y: 82 } }),
  pose({ head: { x: 150, y: 48 }, shoulder: { x: 145, y: 88 }, hip: { x: 148, y: 148 } }, { elbow: { x: 155, y: 118 }, hand: { x: 172, y: 100 } }),
], { highlightJoints: ["elbow", "hand"] });

const curlConcentration = miniGuide("curl-concentration", "Concentration Curl", [
  pose({ head: { x: 150, y: 55 }, shoulder: { x: 142, y: 95 }, hip: { x: 145, y: 155 }, frontKnee: { x: 175, y: 195 } }, { elbow: { x: 168, y: 155 }, hand: { x: 182, y: 168 } }),
  pose({ head: { x: 150, y: 55 }, shoulder: { x: 142, y: 95 }, hip: { x: 145, y: 155 }, frontKnee: { x: 175, y: 195 } }, { elbow: { x: 168, y: 155 }, hand: { x: 188, y: 145 } }),
  pose({ head: { x: 150, y: 55 }, shoulder: { x: 142, y: 95 }, hip: { x: 145, y: 155 }, frontKnee: { x: 175, y: 195 } }, { elbow: { x: 168, y: 155 }, hand: { x: 192, y: 125 } }),
  pose({ head: { x: 150, y: 55 }, shoulder: { x: 142, y: 95 }, hip: { x: 145, y: 155 }, frontKnee: { x: 175, y: 195 } }, { elbow: { x: 168, y: 155 }, hand: { x: 188, y: 145 } }),
]);

const pressBench = getExerciseGuide("bench-press")!;
const pressOhp = getExerciseGuide("shoulder-press")!;

const pressIncline = miniGuide("press-incline", "Incline Press", [
  { head: { x: 195, y: 95 }, shoulder: { x: 175, y: 115 }, elbow: { x: 155, y: 135 }, hand: { x: 138, y: 148 }, hip: { x: 148, y: 168 }, frontKnee: { x: 152, y: 210 }, frontAnkle: { x: 152, y: 252 }, backKnee: { x: 148, y: 210 }, backAnkle: { x: 148, y: 252 } },
  { head: { x: 195, y: 95 }, shoulder: { x: 175, y: 115 }, elbow: { x: 162, y: 118 }, hand: { x: 148, y: 108 }, hip: { x: 148, y: 168 }, frontKnee: { x: 152, y: 210 }, frontAnkle: { x: 152, y: 252 }, backKnee: { x: 148, y: 210 }, backAnkle: { x: 148, y: 252 } },
  { head: { x: 195, y: 95 }, shoulder: { x: 175, y: 115 }, elbow: { x: 168, y: 95 }, hand: { x: 158, y: 72 }, hip: { x: 148, y: 168 }, frontKnee: { x: 152, y: 210 }, frontAnkle: { x: 152, y: 252 }, backKnee: { x: 148, y: 210 }, backAnkle: { x: 148, y: 252 } },
  { head: { x: 195, y: 95 }, shoulder: { x: 175, y: 115 }, elbow: { x: 162, y: 118 }, hand: { x: 148, y: 108 }, hip: { x: 148, y: 168 }, frontKnee: { x: 152, y: 210 }, frontAnkle: { x: 152, y: 252 }, backKnee: { x: 148, y: 210 }, backAnkle: { x: 148, y: 252 } },
], { highlightJoints: ["elbow", "shoulder"] });

const pressMachine = miniGuide("press-machine", "Machine Press", [
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 175, y: 95 }, hand: { x: 198, y: 88 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 168, y: 105 }, hand: { x: 188, y: 108 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 158, y: 118 }, hand: { x: 172, y: 128 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 168, y: 105 }, hand: { x: 188, y: 108 } }),
]);

const flyPecDeckKeyframes: PoseFrame[] = [
  {
    head: { x: 150, y: 42 }, leftShoulder: { x: 128, y: 82 }, rightShoulder: { x: 172, y: 82 },
    leftElbow: { x: 108, y: 95 }, rightElbow: { x: 192, y: 95 },
    leftHand: { x: 88, y: 88 }, rightHand: { x: 212, y: 88 },
    leftHip: { x: 136, y: 152 }, rightHip: { x: 164, y: 152 },
    leftKnee: { x: 134, y: 200 }, rightKnee: { x: 166, y: 200 },
    leftAnkle: { x: 134, y: 252 }, rightAnkle: { x: 166, y: 252 },
  },
  {
    head: { x: 150, y: 42 }, leftShoulder: { x: 128, y: 82 }, rightShoulder: { x: 172, y: 82 },
    leftElbow: { x: 118, y: 100 }, rightElbow: { x: 182, y: 100 },
    leftHand: { x: 108, y: 108 }, rightHand: { x: 192, y: 108 },
    leftHip: { x: 136, y: 152 }, rightHip: { x: 164, y: 152 },
    leftKnee: { x: 134, y: 200 }, rightKnee: { x: 166, y: 200 },
    leftAnkle: { x: 134, y: 252 }, rightAnkle: { x: 166, y: 252 },
  },
  {
    head: { x: 150, y: 42 }, leftShoulder: { x: 128, y: 82 }, rightShoulder: { x: 172, y: 82 },
    leftElbow: { x: 138, y: 108 }, rightElbow: { x: 162, y: 108 },
    leftHand: { x: 148, y: 118 }, rightHand: { x: 152, y: 118 },
    leftHip: { x: 136, y: 152 }, rightHip: { x: 164, y: 152 },
    leftKnee: { x: 134, y: 200 }, rightKnee: { x: 166, y: 200 },
    leftAnkle: { x: 134, y: 252 }, rightAnkle: { x: 166, y: 252 },
  },
  {
    head: { x: 150, y: 42 }, leftShoulder: { x: 128, y: 82 }, rightShoulder: { x: 172, y: 82 },
    leftElbow: { x: 118, y: 100 }, rightElbow: { x: 182, y: 100 },
    leftHand: { x: 108, y: 108 }, rightHand: { x: 192, y: 108 },
    leftHip: { x: 136, y: 152 }, rightHip: { x: 164, y: 152 },
    leftKnee: { x: 134, y: 200 }, rightKnee: { x: 166, y: 200 },
    leftAnkle: { x: 134, y: 252 }, rightAnkle: { x: 166, y: 252 },
  },
];

const flyPecDeckFixed = miniGuide("fly-pec-deck", "Pec Deck", flyPecDeckKeyframes, {
  recommendedView: "front",
  highlightJoints: ["leftElbow", "rightElbow", "leftHand", "rightHand"],
  frontKeyframes: flyPecDeckKeyframes,
  frontHighlightJoints: ["leftElbow", "rightElbow"],
});
flyPecDeckFixed.connections = FRONT;
flyPecDeckFixed.frontConnections = FRONT;

const flyDumbbell = miniGuide("fly-dumbbell", "Dumbbell Fly", [
  pose({}, { elbow: { x: 132, y: 95 }, hand: { x: 98, y: 88 } }),
  pose({}, { elbow: { x: 138, y: 105 }, hand: { x: 118, y: 112 } }),
  pose({}, { elbow: { x: 148, y: 115 }, hand: { x: 148, y: 128 } }),
  pose({}, { elbow: { x: 138, y: 105 }, hand: { x: 118, y: 112 } }),
], {
  recommendedView: "front",
  frontKeyframes: curlStanding.frontKeyframes,
  frontHighlightJoints: ["leftElbow", "rightElbow"],
});

const rowSeatedCable = miniGuide("row-seated-cable", "Seated Cable Row", [
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 178, y: 95 }, hand: { x: 205, y: 92 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 162, y: 102 }, hand: { x: 178, y: 108 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 142, y: 98 }, hand: { x: 138, y: 102 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 162, y: 102 }, hand: { x: 178, y: 108 } }),
]);

const pulldown = miniGuide("pulldown", "Lat Pulldown", [
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 152, y: 55 }, hand: { x: 155, y: 28 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 158, y: 72 }, hand: { x: 162, y: 48 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 168, y: 95 }, hand: { x: 175, y: 108 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 } }, { elbow: { x: 158, y: 72 }, hand: { x: 162, y: 48 } }),
]);

const pullup = miniGuide("pullup", "Pull-Up", [
  pose({ head: { x: 150, y: 48 }, shoulder: { x: 148, y: 72 } }, { elbow: { x: 152, y: 48 }, hand: { x: 155, y: 22 } }),
  pose({ head: { x: 150, y: 55 }, shoulder: { x: 148, y: 78 } }, { elbow: { x: 158, y: 62 }, hand: { x: 162, y: 22 } }),
  pose({ head: { x: 150, y: 38 }, shoulder: { x: 148, y: 68 } }, { elbow: { x: 168, y: 82 }, hand: { x: 172, y: 22 } }),
  pose({ head: { x: 150, y: 55 }, shoulder: { x: 148, y: 78 } }, { elbow: { x: 158, y: 62 }, hand: { x: 162, y: 22 } }),
], { highlightJoints: ["elbow", "shoulder", "hand"] });

const legPress = miniGuide("leg-press", "Leg Press", [
  pose({ head: { x: 195, y: 108 }, shoulder: { x: 178, y: 128 }, hip: { x: 155, y: 148 } }, { elbow: { x: 168, y: 138 }, hand: { x: 158, y: 148 } }),
  pose({ head: { x: 195, y: 108 }, shoulder: { x: 178, y: 128 }, hip: { x: 155, y: 148 }, frontKnee: { x: 175, y: 175 }, frontAnkle: { x: 195, y: 195 } }, { elbow: { x: 168, y: 138 }, hand: { x: 158, y: 148 } }),
  pose({ head: { x: 195, y: 108 }, shoulder: { x: 178, y: 128 }, hip: { x: 155, y: 148 }, frontKnee: { x: 158, y: 155 }, frontAnkle: { x: 148, y: 175 } }, { elbow: { x: 168, y: 138 }, hand: { x: 158, y: 148 } }),
  pose({ head: { x: 195, y: 108 }, shoulder: { x: 178, y: 128 }, hip: { x: 155, y: 148 }, frontKnee: { x: 175, y: 175 }, frontAnkle: { x: 195, y: 195 } }, { elbow: { x: 168, y: 138 }, hand: { x: 158, y: 148 } }),
], { highlightJoints: ["frontKnee", "hip"] });

const legExtension = miniGuide("leg-extension", "Leg Extension", [
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 }, frontKnee: { x: 168, y: 152 }, frontAnkle: { x: 195, y: 155 } }, { elbow: { x: 168, y: 108 }, hand: { x: 178, y: 128 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 }, frontKnee: { x: 168, y: 135 }, frontAnkle: { x: 198, y: 118 } }, { elbow: { x: 168, y: 108 }, hand: { x: 178, y: 128 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 }, frontKnee: { x: 168, y: 115 }, frontAnkle: { x: 200, y: 88 } }, { elbow: { x: 168, y: 108 }, hand: { x: 178, y: 128 } }),
  pose({ head: { x: 150, y: 42 }, shoulder: { x: 148, y: 82 }, hip: { x: 148, y: 152 }, frontKnee: { x: 168, y: 135 }, frontAnkle: { x: 198, y: 118 } }, { elbow: { x: 168, y: 108 }, hand: { x: 178, y: 128 } }),
], { highlightJoints: ["frontKnee"] });

const tricepPushdown = miniGuide("tricep-pushdown", "Tricep Pushdown", [
  pose({}, { elbow: { x: 152, y: 95 }, hand: { x: 158, y: 118 } }),
  pose({}, { elbow: { x: 152, y: 95 }, hand: { x: 158, y: 148 } }),
  pose({}, { elbow: { x: 152, y: 95 }, hand: { x: 158, y: 178 } }),
  pose({}, { elbow: { x: 152, y: 95 }, hand: { x: 158, y: 148 } }),
], { highlightJoints: ["elbow", "hand"] });

const facePull = miniGuide("face-pull", "Face Pull", [
  pose({}, { elbow: { x: 168, y: 72 }, hand: { x: 188, y: 58 } }),
  pose({}, { elbow: { x: 158, y: 78 }, hand: { x: 168, y: 72 } }),
  pose({}, { elbow: { x: 148, y: 82 }, hand: { x: 148, y: 88 } }),
  pose({}, { elbow: { x: 158, y: 78 }, hand: { x: 168, y: 72 } }),
]);

const hipThrust = miniGuide("hip-thrust", "Hip Thrust", [
  { head: { x: 88, y: 168 }, shoulder: { x: 108, y: 178 }, elbow: { x: 118, y: 188 }, hand: { x: 128, y: 195 }, hip: { x: 168, y: 188 }, frontKnee: { x: 195, y: 198 }, frontAnkle: { x: 215, y: 248 }, backKnee: { x: 195, y: 198 }, backAnkle: { x: 215, y: 248 } },
  { head: { x: 88, y: 158 }, shoulder: { x: 108, y: 168 }, elbow: { x: 118, y: 178 }, hand: { x: 128, y: 185 }, hip: { x: 168, y: 158 }, frontKnee: { x: 195, y: 178 }, frontAnkle: { x: 215, y: 248 }, backKnee: { x: 195, y: 178 }, backAnkle: { x: 215, y: 248 } },
  { head: { x: 88, y: 148 }, shoulder: { x: 108, y: 158 }, elbow: { x: 118, y: 168 }, hand: { x: 128, y: 175 }, hip: { x: 168, y: 128 }, frontKnee: { x: 195, y: 158 }, frontAnkle: { x: 215, y: 248 }, backKnee: { x: 195, y: 158 }, backAnkle: { x: 215, y: 248 } },
  { head: { x: 88, y: 158 }, shoulder: { x: 108, y: 168 }, elbow: { x: 118, y: 178 }, hand: { x: 128, y: 185 }, hip: { x: 168, y: 158 }, frontKnee: { x: 195, y: 178 }, frontAnkle: { x: 215, y: 248 }, backKnee: { x: 195, y: 178 }, backAnkle: { x: 215, y: 248 } },
], { highlightJoints: ["hip"] });

const dip = miniGuide("dip", "Dip", [
  pose({ shoulder: { x: 148, y: 78 } }, { elbow: { x: 152, y: 105 }, hand: { x: 155, y: 68 } }),
  pose({ shoulder: { x: 148, y: 88 } }, { elbow: { x: 158, y: 118 }, hand: { x: 162, y: 68 } }),
  pose({ shoulder: { x: 148, y: 98 } }, { elbow: { x: 168, y: 132 }, hand: { x: 172, y: 68 } }),
  pose({ shoulder: { x: 148, y: 88 } }, { elbow: { x: 158, y: 118 }, hand: { x: 162, y: 68 } }),
]);

const squatBack = getExerciseGuide("squat")!;
const lunge = getExerciseGuide("lunge")!;
const deadlift = getExerciseGuide("deadlift")!;
const rowBent = getExerciseGuide("barbell-row")!;
const lateralRaise = getExerciseGuide("lateral-raise")!;
const pushup = getExerciseGuide("pushup")!;
const plank = getExerciseGuide("plank")!;
const situp = getExerciseGuide("situp")!;
const burpee = getExerciseGuide("burpee")!;
const jumpingJack = getExerciseGuide("jumping-jack")!;
const mountainClimber = getExerciseGuide("mountain-climber")!;

const DEMO_POSES: Record<DemoPoseId, ExerciseVisualGuide> = {
  "curl-standing": curlStanding,
  "curl-preacher": curlPreacher,
  "curl-concentration": curlConcentration,
  "curl-spider": curlPreacher,
  "press-ohp": pressOhp,
  "press-bench": pressBench,
  "press-incline": pressIncline,
  "press-machine": pressMachine,
  "fly-dumbbell": flyDumbbell,
  "fly-cable": flyDumbbell,
  "fly-pec-deck": flyPecDeckFixed,
  pushup,
  dip,
  "row-bent": rowBent,
  "row-single": rowBent,
  "row-seated-cable": rowSeatedCable,
  "row-machine": rowSeatedCable,
  pulldown,
  "pulldown-straight-arm": pulldown,
  pullup,
  "inverted-row": pushup,
  deadlift,
  "good-morning": deadlift,
  "squat-back": squatBack,
  "squat-goblet": squatBack,
  "leg-press": legPress,
  "hack-squat": squatBack,
  "leg-extension": legExtension,
  "leg-curl-lying": legPress,
  "leg-curl-seated": legExtension,
  lunge,
  "step-up": lunge,
  "wall-sit": squatBack,
  "tricep-pushdown": tricepPushdown,
  "tricep-overhead": getExerciseGuide("tricep-extension")!,
  "tricep-skull": pressBench,
  "tricep-kickback": tricepPushdown,
  "tricep-machine": tricepPushdown,
  "lateral-raise": lateralRaise,
  "front-raise": lateralRaise,
  "rear-delt-fly": flyDumbbell,
  "face-pull": facePull,
  "upright-row": rowBent,
  "hip-thrust": hipThrust,
  "glute-bridge": hipThrust,
  "hip-abduction": lunge,
  "donkey-kick": lunge,
  "calf-raise": squatBack,
  "wrist-curl": curlStanding,
  "farmer-walk": curlStanding,
  "dead-hang": pullup,
  plank,
  "side-plank": plank,
  crunch: situp,
  situp,
  "leg-raise-hanging": pullup,
  "leg-raise-lying": situp,
  "ab-wheel": plank,
  "mountain-climber": mountainClimber,
  "russian-twist": situp,
  burpee,
  "jumping-jack": jumpingJack,
  "box-jump": burpee,
  "kettlebell-swing": deadlift,
  "kettlebell-press": pressOhp,
  "landmine-press": pressOhp,
  "pike-pushup": pushup,
  superman: hipThrust,
  "suitcase-carry": lunge,
  "cardio-row": rowSeatedCable,
  "cardio-run": burpee,
};

export function getDemoPose(id: DemoPoseId): ExerciseVisualGuide {
  return DEMO_POSES[id] ?? curlStanding;
}
