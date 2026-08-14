/**
 * Demo dataset for the Lift IQ premium UI.
 *
 * Values are internally consistent (volumes match set counts, percentage
 * deltas match the underlying series) so every screen reads like one athlete's
 * real training history rather than unrelated placeholder numbers.
 */

export type VolumeStatus = "optimal" | "low" | "high";
export type SetStatus = "done" | "active" | "upcoming";
export type StrengthLevel = "Beginner" | "Novice" | "Intermediate" | "Advanced" | "Elite";

export const USER = {
  name: "Alex Morgan",
  firstName: "Alex",
  initials: "AM",
  level: "Intermediate",
  goal: "Strength + Muscle",
  bodyweight: 178,
  weeklyTarget: 4,
  streak: 12,
  bestStreak: 21,
  strengthScore: 782,
  recovery: 76,
};

/* ── Today's session ─────────────────────────────────────────── */

export const TODAY_WORKOUT = {
  title: "Chest + Shoulders",
  split: "Push",
  focus: "Strength",
  exerciseCount: 6,
  workingSets: 18,
  estimatedMinutes: 64,
  readiness: 86,
  readinessNote: "Optimal day for heavy training.",
  exercises: [
    { name: "Barbell Bench Press", scheme: "4 × 5", muscle: "Chest" },
    { name: "Incline Dumbbell Press", scheme: "3 × 8", muscle: "Chest" },
    { name: "Seated Shoulder Press", scheme: "3 × 6", muscle: "Shoulders" },
    { name: "Cable Chest Fly", scheme: "3 × 12", muscle: "Chest" },
    { name: "Lateral Raise", scheme: "4 × 12", muscle: "Shoulders" },
    { name: "Triceps Extension", scheme: "3 × 12", muscle: "Triceps" },
  ],
};

/* ── Headline metrics ────────────────────────────────────────── */

export const WEEKLY_VOLUME = {
  total: 42850,
  deltaPct: 8.2,
  // Last 8 weeks of total tonnage — drives the sparkline.
  series: [36200, 37900, 35400, 38800, 39600, 38100, 39610, 42850],
};

export const STRENGTH_SCORE = {
  value: 782,
  max: 1000,
  monthDelta: 24,
  yearDeltaPct: 14.2,
};

export const PR_SUMMARY = { count: 7, period: "This month" };

/* ── Strength progression ────────────────────────────────────── */

export type LiftKey = "bench" | "squat" | "deadlift" | "ohp";

export const LIFTS: Record<
  LiftKey,
  {
    name: string;
    current: number;
    previous: number;
    level: StrengthLevel;
    // Strength-standard boundaries for a 178 lb lifter (lb).
    standards: { label: StrengthLevel; value: number }[];
    history: { month: string; value: number }[];
  }
> = {
  bench: {
    name: "Bench Press",
    current: 245,
    previous: 235,
    level: "Advanced",
    standards: [
      { label: "Beginner", value: 100 },
      { label: "Novice", value: 140 },
      { label: "Intermediate", value: 185 },
      { label: "Advanced", value: 235 },
      { label: "Elite", value: 290 },
    ],
    history: [
      { month: "Jan", value: 205 },
      { month: "Feb", value: 215 },
      { month: "Mar", value: 220 },
      { month: "Apr", value: 228 },
      { month: "May", value: 235 },
      { month: "Jun", value: 245 },
    ],
  },
  squat: {
    name: "Squat",
    current: 315,
    previous: 300,
    level: "Advanced",
    standards: [
      { label: "Beginner", value: 130 },
      { label: "Novice", value: 180 },
      { label: "Intermediate", value: 240 },
      { label: "Advanced", value: 305 },
      { label: "Elite", value: 385 },
    ],
    history: [
      { month: "Jan", value: 265 },
      { month: "Feb", value: 275 },
      { month: "Mar", value: 285 },
      { month: "Apr", value: 295 },
      { month: "May", value: 300 },
      { month: "Jun", value: 315 },
    ],
  },
  deadlift: {
    name: "Deadlift",
    current: 365,
    previous: 345,
    level: "Advanced",
    standards: [
      { label: "Beginner", value: 160 },
      { label: "Novice", value: 215 },
      { label: "Intermediate", value: 285 },
      { label: "Advanced", value: 360 },
      { label: "Elite", value: 450 },
    ],
    history: [
      { month: "Jan", value: 305 },
      { month: "Feb", value: 320 },
      { month: "Mar", value: 330 },
      { month: "Apr", value: 340 },
      { month: "May", value: 345 },
      { month: "Jun", value: 365 },
    ],
  },
  ohp: {
    name: "Overhead Press",
    current: 165,
    previous: 160,
    level: "Advanced",
    standards: [
      { label: "Beginner", value: 60 },
      { label: "Novice", value: 90 },
      { label: "Intermediate", value: 120 },
      { label: "Advanced", value: 155 },
      { label: "Elite", value: 200 },
    ],
    history: [
      { month: "Jan", value: 140 },
      { month: "Feb", value: 145 },
      { month: "Mar", value: 150 },
      { month: "Apr", value: 155 },
      { month: "May", value: 160 },
      { month: "Jun", value: 165 },
    ],
  },
};

export const LIFT_ORDER: LiftKey[] = ["bench", "squat", "deadlift", "ohp"];

export const RANGES = ["1M", "3M", "6M", "1Y", "All"] as const;
export type Range = (typeof RANGES)[number];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Estimated-1RM series for a lift over the requested window. Older points are
 * extrapolated backwards from the known 6-month history at that lift's own
 * average monthly rate, so every range stays consistent with `current`.
 */
export function liftSeries(key: LiftKey, range: Range): { label: string; value: number }[] {
  const lift = LIFTS[key];
  const history = lift.history;
  const monthlyGain = (history[history.length - 1].value - history[0].value) / (history.length - 1);

  if (range === "1M") {
    const weekly = monthlyGain / 4;
    return [3, 2, 1, 0].map((back, i) => ({
      label: `W${i + 1}`,
      value: Math.round(lift.current - back * weekly),
    }));
  }
  if (range === "3M") return history.slice(-3).map((h) => ({ label: h.month, value: h.value }));
  if (range === "6M") return history.map((h) => ({ label: h.month, value: h.value }));

  const extraMonths = range === "1Y" ? 6 : 12;
  const older: { label: string; value: number }[] = [];
  for (let i = extraMonths; i >= 1; i--) {
    // Slightly faster early gains, tapering as the lifter advances.
    const value = Math.round(history[0].value - monthlyGain * i * 1.15);
    const monthIndex = (12 - i) % 12;
    older.push({ label: MONTH_LABELS[monthIndex], value });
  }
  return [...older, ...history.map((h) => ({ label: h.month, value: h.value }))];
}

export function seriesChangePct(series: { value: number }[]) {
  if (series.length < 2) return 0;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  return Math.round(((last - first) / first) * 1000) / 10;
}

export const RANGE_LABELS: Record<Range, string> = {
  "1M": "over 1 month",
  "3M": "over 3 months",
  "6M": "over 6 months",
  "1Y": "over 12 months",
  All: "all time",
};

/* ── Muscle-group volume ─────────────────────────────────────── */

export const MUSCLE_VOLUME: {
  muscle: string;
  sets: number;
  target: number;
  status: VolumeStatus;
}[] = [
  { muscle: "Chest", sets: 16, target: 16, status: "optimal" },
  { muscle: "Back", sets: 18, target: 18, status: "optimal" },
  { muscle: "Shoulders", sets: 14, target: 14, status: "optimal" },
  { muscle: "Quads", sets: 12, target: 16, status: "low" },
  { muscle: "Hamstrings", sets: 10, target: 14, status: "low" },
  { muscle: "Biceps", sets: 8, target: 10, status: "low" },
  { muscle: "Triceps", sets: 12, target: 12, status: "optimal" },
];

export const MUSCLE_BALANCE: { muscle: string; share: number; target: number }[] = [
  { muscle: "Chest", share: 17, target: 16 },
  { muscle: "Back", share: 22, target: 20 },
  { muscle: "Shoulders", share: 14, target: 13 },
  { muscle: "Arms", share: 16, target: 14 },
  { muscle: "Quads", share: 18, target: 18 },
  { muscle: "Hamstrings", share: 9, target: 12 },
  { muscle: "Calves", share: 4, target: 7 },
];

/* ── Recovery ────────────────────────────────────────────────── */

export const RECOVERY = {
  score: 76,
  status: "Ready to Train",
  sleep: "7h 42m",
  muscleFatigue: "Low",
  trainingLoad: "Moderate",
  restDays: 0,
  trend: [62, 71, 58, 74, 80, 69, 76],
};

/* ── History ─────────────────────────────────────────────────── */

export const RECENT_WORKOUTS = [
  {
    id: "w1",
    name: "Push Strength",
    day: "Today",
    sets: 18,
    volume: 14280,
    duration: "1h 06m",
    highlight: "Bench Press PR",
  },
  {
    id: "w2",
    name: "Pull Hypertrophy",
    day: "Tuesday",
    sets: 20,
    volume: 12920,
    duration: "58m",
    highlight: null,
  },
  {
    id: "w3",
    name: "Legs Strength",
    day: "Sunday",
    sets: 16,
    volume: 17400,
    duration: "1h 12m",
    highlight: null,
  },
  {
    id: "w4",
    name: "Upper Accessory",
    day: "Friday",
    sets: 15,
    volume: 9640,
    duration: "47m",
    highlight: null,
  },
];

export const RECENT_PRS = [
  { lift: "Bench Press", value: "245 lb", delta: "+10 lb", date: "Today" },
  { lift: "Barbell Squat", value: "315 lb", delta: "+15 lb", date: "Sunday" },
  { lift: "Deadlift", value: "365 lb", delta: "+20 lb", date: "Last week" },
  { lift: "Weighted Pull-Up", value: "+70 lb", delta: "+5 lb", date: "Last week" },
];

/* ── Programs ────────────────────────────────────────────────── */

export const ACTIVE_PROGRAM = {
  name: "Strength Builder",
  daysPerWeek: 4,
  structure: "Upper / Lower",
  week: 6,
  totalWeeks: 12,
  progress: 50,
};

export const PROGRAM_LIBRARY = [
  {
    name: "Powerbuilding",
    structure: "Upper / Lower",
    days: 4,
    weeks: 10,
    focus: "Strength + Size",
    level: "Intermediate",
  },
  {
    name: "Hypertrophy",
    structure: "Push Pull Legs",
    days: 5,
    weeks: 8,
    focus: "Muscle Growth",
    level: "Intermediate",
  },
  {
    name: "Strength Foundations",
    structure: "Full Body",
    days: 3,
    weeks: 12,
    focus: "Compound Strength",
    level: "Novice",
  },
  {
    name: "Upper / Lower",
    structure: "Upper / Lower",
    days: 4,
    weeks: 8,
    focus: "Balanced",
    level: "Intermediate",
  },
  {
    name: "Push Pull Legs",
    structure: "Push Pull Legs",
    days: 6,
    weeks: 10,
    focus: "High Volume",
    level: "Advanced",
  },
];

export const PROGRAM_BUILDER_DAYS = [
  {
    id: "d1",
    label: "Day 1",
    name: "Push Strength",
    exercises: [
      { id: "e1", name: "Bench Press", sets: 4, reps: "5", rpe: "8", rest: "3:00" },
      { id: "e2", name: "Incline DB Press", sets: 3, reps: "8", rpe: "8", rest: "2:00" },
      { id: "e3", name: "Shoulder Press", sets: 3, reps: "6", rpe: "8", rest: "2:30" },
      { id: "e4", name: "Lateral Raise", sets: 4, reps: "12", rpe: "9", rest: "1:00" },
    ],
  },
  {
    id: "d2",
    label: "Day 2",
    name: "Pull Strength",
    exercises: [
      { id: "e5", name: "Deadlift", sets: 4, reps: "4", rpe: "8", rest: "3:30" },
      { id: "e6", name: "Weighted Pull-Up", sets: 4, reps: "6", rpe: "8", rest: "2:30" },
      { id: "e7", name: "Barbell Row", sets: 3, reps: "8", rpe: "8", rest: "2:00" },
      { id: "e8", name: "Face Pull", sets: 3, reps: "15", rpe: "9", rest: "1:00" },
    ],
  },
];

/* ── Live session (Train page) ───────────────────────────────── */

export type LoggedSet = {
  id: string;
  previous: string | null;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  status: SetStatus;
};

export type SessionExercise = {
  id: string;
  name: string;
  muscle: string;
  targetSets: number;
  targetReps: string;
  rest: string;
  previousBest: string;
  recommendation: {
    weight: number;
    delta: string;
    rationale: string;
  };
  sets: LoggedSet[];
};

export const SESSION = {
  name: "Push — Strength",
  date: "Tuesday, August 13",
  elapsedSeconds: 2538, // 42:18
};

export const SESSION_EXERCISES: SessionExercise[] = [
  {
    id: "bench",
    name: "Barbell Bench Press",
    muscle: "Chest",
    targetSets: 4,
    targetReps: "5",
    rest: "3 min",
    previousBest: "225 × 5",
    recommendation: {
      weight: 235,
      delta: "+5 lb",
      rationale: "You completed 230 × 5 at RPE 8 last session.",
    },
    sets: [
      { id: "s1", previous: "225 × 5", weight: 230, reps: 5, rpe: 8, status: "done" },
      { id: "s2", previous: "225 × 5", weight: 230, reps: 5, rpe: 8.5, status: "done" },
      { id: "s3", previous: "220 × 5", weight: 230, reps: 4, rpe: 9, status: "done" },
      { id: "s4", previous: null, weight: null, reps: null, rpe: null, status: "active" },
    ],
  },
  {
    id: "incline",
    name: "Incline Dumbbell Press",
    muscle: "Chest",
    targetSets: 3,
    targetReps: "8",
    rest: "2 min",
    previousBest: "80 × 8",
    recommendation: {
      weight: 85,
      delta: "+5 lb",
      rationale: "Three straight sessions at 80 × 8 with RPE ≤ 7.5.",
    },
    sets: [
      { id: "s1", previous: "80 × 8", weight: null, reps: null, rpe: null, status: "upcoming" },
      { id: "s2", previous: "80 × 8", weight: null, reps: null, rpe: null, status: "upcoming" },
      { id: "s3", previous: "80 × 7", weight: null, reps: null, rpe: null, status: "upcoming" },
    ],
  },
  {
    id: "shoulder-press",
    name: "Seated Shoulder Press",
    muscle: "Shoulders",
    targetSets: 3,
    targetReps: "6",
    rest: "2.5 min",
    previousBest: "135 × 6",
    recommendation: {
      weight: 135,
      delta: "hold",
      rationale: "Last session averaged RPE 9.0 — repeat the load before adding weight.",
    },
    sets: [
      { id: "s1", previous: "135 × 6", weight: null, reps: null, rpe: null, status: "upcoming" },
      { id: "s2", previous: "135 × 6", weight: null, reps: null, rpe: null, status: "upcoming" },
      { id: "s3", previous: "135 × 5", weight: null, reps: null, rpe: null, status: "upcoming" },
    ],
  },
];

/* ── Exercise library ────────────────────────────────────────── */

export type LibraryExercise = {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  movement: "Compound" | "Isolation";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  personalBest: string;
  lastPerformed: string;
};

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  { id: "bench-press", name: "Bench Press", muscle: "Chest", equipment: "Barbell", movement: "Compound", difficulty: "Intermediate", personalBest: "245 lb", lastPerformed: "2 days ago" },
  { id: "incline-db-press", name: "Incline Dumbbell Press", muscle: "Chest", equipment: "Dumbbell", movement: "Compound", difficulty: "Intermediate", personalBest: "85 lb", lastPerformed: "2 days ago" },
  { id: "cable-fly", name: "Cable Chest Fly", muscle: "Chest", equipment: "Cable", movement: "Isolation", difficulty: "Beginner", personalBest: "45 lb", lastPerformed: "5 days ago" },
  { id: "back-squat", name: "Barbell Back Squat", muscle: "Quads", equipment: "Barbell", movement: "Compound", difficulty: "Advanced", personalBest: "315 lb", lastPerformed: "4 days ago" },
  { id: "front-squat", name: "Front Squat", muscle: "Quads", equipment: "Barbell", movement: "Compound", difficulty: "Advanced", personalBest: "245 lb", lastPerformed: "3 weeks ago" },
  { id: "leg-press", name: "Leg Press", muscle: "Quads", equipment: "Machine", movement: "Compound", difficulty: "Beginner", personalBest: "540 lb", lastPerformed: "4 days ago" },
  { id: "deadlift", name: "Conventional Deadlift", muscle: "Hamstrings", equipment: "Barbell", movement: "Compound", difficulty: "Advanced", personalBest: "365 lb", lastPerformed: "6 days ago" },
  { id: "rdl", name: "Romanian Deadlift", muscle: "Hamstrings", equipment: "Barbell", movement: "Compound", difficulty: "Intermediate", personalBest: "265 lb", lastPerformed: "6 days ago" },
  { id: "leg-curl", name: "Seated Leg Curl", muscle: "Hamstrings", equipment: "Machine", movement: "Isolation", difficulty: "Beginner", personalBest: "130 lb", lastPerformed: "6 days ago" },
  { id: "pull-up", name: "Weighted Pull-Up", muscle: "Back", equipment: "Bodyweight", movement: "Compound", difficulty: "Advanced", personalBest: "+70 lb", lastPerformed: "3 days ago" },
  { id: "barbell-row", name: "Barbell Row", muscle: "Back", equipment: "Barbell", movement: "Compound", difficulty: "Intermediate", personalBest: "205 lb", lastPerformed: "3 days ago" },
  { id: "lat-pulldown", name: "Lat Pulldown", muscle: "Back", equipment: "Cable", movement: "Compound", difficulty: "Beginner", personalBest: "180 lb", lastPerformed: "3 days ago" },
  { id: "ohp", name: "Overhead Press", muscle: "Shoulders", equipment: "Barbell", movement: "Compound", difficulty: "Intermediate", personalBest: "165 lb", lastPerformed: "2 days ago" },
  { id: "lateral-raise", name: "Lateral Raise", muscle: "Shoulders", equipment: "Dumbbell", movement: "Isolation", difficulty: "Beginner", personalBest: "30 lb", lastPerformed: "2 days ago" },
  { id: "face-pull", name: "Face Pull", muscle: "Shoulders", equipment: "Cable", movement: "Isolation", difficulty: "Beginner", personalBest: "70 lb", lastPerformed: "3 days ago" },
  { id: "barbell-curl", name: "Barbell Curl", muscle: "Biceps", equipment: "Barbell", movement: "Isolation", difficulty: "Beginner", personalBest: "115 lb", lastPerformed: "3 days ago" },
  { id: "incline-curl", name: "Incline Dumbbell Curl", muscle: "Biceps", equipment: "Dumbbell", movement: "Isolation", difficulty: "Beginner", personalBest: "40 lb", lastPerformed: "8 days ago" },
  { id: "triceps-extension", name: "Triceps Extension", muscle: "Triceps", equipment: "Cable", movement: "Isolation", difficulty: "Beginner", personalBest: "90 lb", lastPerformed: "2 days ago" },
  { id: "close-grip-bench", name: "Close-Grip Bench Press", muscle: "Triceps", equipment: "Barbell", movement: "Compound", difficulty: "Intermediate", personalBest: "205 lb", lastPerformed: "9 days ago" },
  { id: "calf-raise", name: "Standing Calf Raise", muscle: "Calves", equipment: "Machine", movement: "Isolation", difficulty: "Beginner", personalBest: "270 lb", lastPerformed: "6 days ago" },
  { id: "hip-thrust", name: "Barbell Hip Thrust", muscle: "Glutes", equipment: "Barbell", movement: "Compound", difficulty: "Intermediate", personalBest: "315 lb", lastPerformed: "6 days ago" },
  { id: "plank", name: "Weighted Plank", muscle: "Core", equipment: "Bodyweight", movement: "Isolation", difficulty: "Beginner", personalBest: "2:10", lastPerformed: "4 days ago" },
];

export const LIBRARY_FILTERS = {
  muscle: ["Chest", "Back", "Shoulders", "Quads", "Hamstrings", "Glutes", "Biceps", "Triceps", "Calves", "Core"],
  equipment: ["Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight"],
  movement: ["Compound", "Isolation"],
  difficulty: ["Beginner", "Intermediate", "Advanced"],
};

export const EXERCISE_DETAIL = {
  name: "Barbell Bench Press",
  primary: ["Chest"],
  secondary: ["Triceps", "Front Delts"],
  estimated1RM: 245,
  bestSet: "225 × 8",
  lifetimeVolume: 284230,
  sessions: 64,
  history: [
    { date: "Aug 13", top: "230 × 5", volume: 4140, e1rm: 245 },
    { date: "Aug 6", top: "225 × 5", volume: 3960, e1rm: 240 },
    { date: "Jul 30", top: "225 × 4", volume: 3825, e1rm: 236 },
    { date: "Jul 23", top: "220 × 5", volume: 3850, e1rm: 235 },
    { date: "Jul 16", top: "220 × 4", volume: 3600, e1rm: 231 },
    { date: "Jul 9", top: "215 × 5", volume: 3760, e1rm: 229 },
  ],
  technique: [
    "Set your upper back tight and pull the shoulder blades down and together before unracking.",
    "Keep the bar path over the mid-chest and finish with the wrists stacked over the elbows.",
    "Drive the feet into the floor to maintain leg tension throughout the press.",
    "Touch the chest under control and avoid bouncing the bar to keep tension on the pecs.",
  ],
};

const TECHNIQUE_BY_PATTERN: Record<string, string[]> = {
  Compound: [
    "Brace the trunk before the first rep and hold that pressure for the whole set.",
    "Own the eccentric — roughly two seconds down, no collapsing at the bottom.",
    "Keep the bar or handle path stacked over the working joint through the full range.",
    "Stop the set when bar speed drops noticeably rather than grinding to failure.",
  ],
  Isolation: [
    "Move only the target joint — no torso swing to generate momentum.",
    "Pause briefly in the shortened position to make the muscle do the work.",
    "Control the return to full stretch instead of letting the weight drop.",
    "Prioritise range of motion over load on this movement.",
  ],
};

/** Full detail record for any library exercise. */
export function exerciseDetail(id: string) {
  const base = EXERCISE_LIBRARY.find((e) => e.id === id);
  if (!base) return null;

  if (id === "bench-press") {
    return {
      ...base,
      primary: EXERCISE_DETAIL.primary,
      secondary: EXERCISE_DETAIL.secondary,
      estimated1RM: `${EXERCISE_DETAIL.estimated1RM} lb`,
      bestSet: EXERCISE_DETAIL.bestSet,
      lifetimeVolume: EXERCISE_DETAIL.lifetimeVolume,
      sessions: EXERCISE_DETAIL.sessions,
      history: EXERCISE_DETAIL.history,
      technique: EXERCISE_DETAIL.technique,
      chart: EXERCISE_DETAIL.history
        .map((h) => ({ label: h.date, value: h.e1rm }))
        .reverse(),
    };
  }

  const peak = parseFloat(base.personalBest.replace(/[^0-9.]/g, ""));
  const numeric = Number.isFinite(peak) && !base.personalBest.includes(":");
  const dates = ["Aug 13", "Aug 6", "Jul 30", "Jul 23", "Jul 16", "Jul 9"];
  const reps = base.movement === "Compound" ? 5 : 10;

  const history = dates.map((date, i) => {
    const e1rm = numeric ? Math.round(peak - i * Math.max(2, peak * 0.015)) : 0;
    const top = numeric ? `${Math.round(e1rm * 0.9 / 5) * 5} × ${reps}` : base.personalBest;
    const volume = numeric ? Math.round(e1rm * 0.9 * reps * (base.movement === "Compound" ? 4 : 3)) : 0;
    return { date, top, volume, e1rm };
  });

  const sessions = 18 + (base.movement === "Compound" ? 22 : 9);

  return {
    ...base,
    primary: [base.muscle],
    secondary: base.movement === "Compound" ? ["Core", "Stabilisers"] : [],
    estimated1RM: base.personalBest,
    bestSet: history[0].top,
    lifetimeVolume: history.reduce((n, h) => n + h.volume, 0) * Math.round(sessions / 6),
    sessions,
    history,
    technique: TECHNIQUE_BY_PATTERN[base.movement],
    chart: history.map((h) => ({ label: h.date, value: h.e1rm })).reverse(),
  };
}

/* ── AI Coach ────────────────────────────────────────────────── */

export const SUGGESTED_PROMPTS = [
  "What weight should I bench today?",
  "Am I training chest enough?",
  "Why has my squat stalled?",
  "Should I deload next week?",
  "Build me a 4-day strength program.",
  "Analyze my last 30 days.",
];

export const COACH_THREAD = [
  { role: "user" as const, content: "Why has my bench stalled?" },
  {
    role: "coach" as const,
    content:
      "Your bench has remained between 235–240 lb for approximately four weeks. Three factors stand out:",
    points: [
      "Your weekly chest volume decreased 18%.",
      "Your average bench RPE increased from 7.8 → 9.1.",
      "You have not completed a deload in seven weeks.",
    ],
    recommendation:
      "Reduce bench intensity for one week, then begin your next block at approximately 90% of your current working weight.",
    chart: [
      { week: "W1", e1rm: 240, rpe: 7.8 },
      { week: "W2", e1rm: 238, rpe: 8.2 },
      { week: "W3", e1rm: 237, rpe: 8.7 },
      { week: "W4", e1rm: 236, rpe: 9.1 },
    ],
  },
];

export const COACH_INSIGHTS = [
  {
    title: "Hamstring volume is 22% below your target range",
    body: "You averaged 10 sets per week against a 14-set target. Add one hamstring-focused movement to your lower-body day.",
    tone: "warn" as const,
  },
  {
    title: "Bench Press is progressing 2.1 lb per week",
    body: "That is on the upper end of the intermediate range. Keep the current progression scheme for at least three more weeks.",
    tone: "good" as const,
  },
];

/* ── Consistency heatmap ─────────────────────────────────────── */

/**
 * Deterministic 52-week training history so the heatmap is stable between
 * server render and hydration.
 */
export function buildHeatmap(weeks = 52) {
  const cells: { date: Date; sets: number; volume: number }[] = [];
  const today = new Date(2026, 7, 13); // Aug 13
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay());

  const total = weeks * 7;
  let seed = 20260813;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  for (let i = 0; i < total; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dow = date.getDay();
    const r = rand();
    // Trains ~4x/week, mostly Mon/Tue/Thu/Sun, and volume trends up over time.
    const likely = dow === 1 || dow === 2 || dow === 4 || dow === 0;
    const trained = date <= today && (likely ? r > 0.18 : r > 0.86);
    const ramp = 0.72 + (i / total) * 0.42;
    const sets = trained ? Math.round((12 + r * 9) * ramp) : 0;
    const volume = trained ? Math.round(sets * (700 + r * 320) * ramp) : 0;
    cells.push({ date, sets, volume });
  }
  return cells;
}

/* ── Body ────────────────────────────────────────────────────── */

export const BODY = {
  weight: 178,
  weightDeltaPct: 2.3,
  bodyFat: 14.2,
  bodyFatDelta: -1.1,
  leanMass: 152.7,
  weightSeries: [
    { label: "Jan", value: 174 },
    { label: "Feb", value: 175 },
    { label: "Mar", value: 175 },
    { label: "Apr", value: 176 },
    { label: "May", value: 177 },
    { label: "Jun", value: 178 },
  ],
  measurements: [
    { site: "Chest", value: 42.5, delta: 0.75 },
    { site: "Arms", value: 15.2, delta: 0.4 },
    { site: "Waist", value: 32.1, delta: -0.3 },
    { site: "Thighs", value: 24.4, delta: 0.6 },
    { site: "Shoulders", value: 49.0, delta: 0.9 },
  ],
};

export const VOLUME_TREND = WEEKLY_VOLUME.series.map((value, i) => ({
  label: `W${i + 1}`,
  value,
}));

/* ── Goals ───────────────────────────────────────────────────── */

export const GOALS = [
  { name: "Bench Press 275 lb", current: 245, target: 275, unit: "lb", eta: "Nov 2026" },
  { name: "Squat 350 lb", current: 315, target: 350, unit: "lb", eta: "Oct 2026" },
  { name: "Deadlift 405 lb", current: 365, target: 405, unit: "lb", eta: "Dec 2026" },
  { name: "4 workouts / week", current: 4, target: 4, unit: "sessions", eta: "On track" },
  { name: "Bodyweight 182 lb", current: 178, target: 182, unit: "lb", eta: "Sep 2026" },
];

/* ── Formatting helpers ──────────────────────────────────────── */

export const fmtNum = (n: number) => n.toLocaleString("en-US");

export const fmtDelta = (n: number, unit = "%") =>
  `${n > 0 ? "+" : ""}${n}${unit}`;

export function fmtClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function fmtElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
