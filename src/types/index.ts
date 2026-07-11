export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type JointStatus = "good" | "moderate" | "poor";

export interface JointFeedback {
  joint: string;
  status: JointStatus;
  message?: string;
}

export interface ExercisePhase {
  name: string;
  entryCondition: (angles: Record<string, number>, landmarks: Landmark[]) => boolean;
}

export interface RepResult {
  score: number;
  issues: JointFeedback[];
  timestamp: number;
  /** False when camera confidence was too low to trust the score. */
  scoreReliable?: boolean;
  /** Number of zero-issue frames during this rep — higher = cleaner */
  issueCount?: number;
  /** Manual log only: which set this rep belongs to (0-based). */
  setIndex?: number;
  /** Manual log only: weight (lbs) used for this rep's set. */
  weight?: number;
}

/** One set entered in the manual (no-camera) workout logger. */
export interface LoggedSet {
  reps: number;
  weight?: number; // lbs; omitted for bodyweight
}

export type PerfectRepReason = "high_score" | "zero_issues" | "full_rom" | "stable_form" | "consistent_tempo";

export const PERFECT_REP_REASON_LABELS: Record<PerfectRepReason, string> = {
  high_score: "Excellent form score",
  zero_issues: "No form corrections needed",
  full_rom: "Full range of motion",
  stable_form: "Rock-solid stability",
  consistent_tempo: "Smooth, controlled tempo",
};

export interface RepCycleConfig {
  primaryAngles: string[];
  startThreshold: number;
  depthThreshold: number;
  minROM: number;
  minDepthFrames?: number;
  cooldownMs?: number;
  combineMethod?: "average" | "min" | "max";
}

export interface ExerciseConfig {
  id: string;
  name: string;
  description: string;
  targetJoints: number[];
  phases: string[];
  detectPhase: (angles: Record<string, number>, landmarks: Landmark[]) => string;
  scoreRep: (angles: Record<string, number>, landmarks: Landmark[], phase: string) => {
    score: number;
    issues: JointFeedback[];
  };
  getCoachingCues: (angles: Record<string, number>, landmarks: Landmark[], phase: string) => string[];
  caloriesPerRep: number;
  repCycle?: RepCycleConfig;
}

// User-created or customized exercise entry in their workout log
export interface UserExercise {
  id: string;
  name: string;
  trackingId: string; // maps to ExerciseConfig.id for pose tracking, or "custom" if untracked
  weight?: number; // in lbs
  targetReps?: number;
  targetSets?: number;
  notes?: string;
  isCustom: boolean;
  createdAt: number;
}

export interface WorkoutSession {
  id: string;
  exercise: string;
  exerciseName?: string;
  weight?: number;
  startTime: number;
  endTime?: number;
  reps: RepResult[];
  totalScore: number;
  caloriesBurned: number;
  isRecorded?: boolean;
  recordingId?: string;
  bestRepIndex?: number;
  bestRepScore?: number;
  bestRepTimestamp?: number;
  bestRepReasons?: PerfectRepReason[];
  perfectRepCount?: number;
  scoreTimeline?: { time: number; score: number }[];
  mistakeSummary?: { issue: string; count: number }[];
  /** "manual" = logged without camera; absent/"camera" = pose-tracked. */
  source?: "camera" | "manual";
  /** Manual log only: the sets as entered (reps + weight per set). */
  sets?: LoggedSet[];
  /** Links this exercise to a multi-exercise workout log (live session). */
  workoutId?: string;
}

/** A named gym session that can contain multiple exercise logs. */
export interface WorkoutLog {
  id: string;
  /** User label, e.g. "Legs and Back". */
  name?: string;
  /** Calendar date YYYY-MM-DD. */
  date: string;
  startTime: number;
  endTime: number;
}

export interface DailyLog {
  date: string;
  sessions: WorkoutSession[];
  totalCalories: number;
  totalReps: number;
  avgScore: number;
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastWorkoutDate: string;
  workoutDates: string[];
}

export type WeightGoal = "lose" | "maintain" | "gain";
export type Gender = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // lbs
  height: number; // inches
  gender: Gender;
  activityLevel: ActivityLevel;
  disabilities: string;
  weightGoal: WeightGoal;
  calorieGoal: number; // daily target
  useRecommendedCalories: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize?: number;
  servingUnit?: string;
  servings?: number;
  date: string;
  timestamp: number;
  meal?: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface RoutineExercise {
  id: string;
  name: string;
  trackingId: string;
  targetSets: number;
  targetReps: number;
  weight?: number;
  restAfterSets: number; // seconds
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  voiceEnabled: boolean;
  sensitivity: "low" | "medium" | "high";
  cameraFacing: "user" | "environment";
  /**
   * "ghost" renders the full skeleton coach overlay; "minimal" hides it and
   * surfaces a compact readiness pill instead — better suited to phones.
   */
  coachingMode: "ghost" | "minimal";
  /** Display unit for weights. Data is always stored in lbs. */
  units?: "lbs" | "kg";
}

export type PoseDetectionStatus = "loading" | "ready" | "detecting" | "error" | "no-camera";

// ── AI Diet Plan ──────────────────────────────────────────────

export type DietPreference =
  | "omnivore"
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "keto"
  | "paleo"
  | "mediterranean";

export interface DietPlanInput {
  /** Pulled from UserProfile, but the user can override in the questionnaire. */
  weight: number; // lbs
  height: number; // inches
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  weightGoal: WeightGoal;
  /** Target daily calories — computed default, user-editable. */
  calorieTarget: number;
  preference: DietPreference;
  mealsPerDay: number;
  /** Free-text allergies / foods to avoid. */
  allergies: string;
  /** Optional cuisine preference, e.g. "Indian, Mediterranean". */
  cuisines: string;
  /** Optional extra notes / constraints for the AI. */
  notes: string;
}

export interface DietPlanFoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietPlanMeal {
  meal: string; // e.g. "Breakfast", "Lunch"
  time?: string; // e.g. "8:00 AM"
  items: DietPlanFoodItem[];
  calories: number;
}

export interface DietPlanMacros {
  protein: number; // grams/day
  carbs: number;
  fat: number;
}

export interface DietPlan {
  id: string;
  createdAt: number;
  /** Snapshot of the inputs used to generate this plan. */
  input: DietPlanInput;
  title: string;
  summary: string;
  dailyCalories: number;
  macros: DietPlanMacros;
  meals: DietPlanMeal[];
  tips: string[];
  hydrationLiters?: number;
  source: "ai" | "fallback";
}
