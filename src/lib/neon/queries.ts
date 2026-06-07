import "server-only";
import { sql } from "./client";
import {
  UserProfile,
  UserSettings,
  WorkoutSession,
  FoodEntry,
  UserExercise,
  StreakData,
  WorkoutRoutine,
} from "@/types";

type Row = Record<string, unknown>;

const DEFAULT_SETTINGS: UserSettings = {
  voiceEnabled: false,
  sensitivity: "medium",
  cameraFacing: "user",
  coachingMode: "ghost",
};

// ── Profile ───────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const rows = (await sql.query(`select * from profiles where id = $1`, [userId])) as Row[];
  const d = rows[0];
  if (!d) return null;
  return {
    name: d.name as string,
    age: d.age as number,
    weight: Number(d.weight),
    height: d.height as number,
    gender: d.gender as UserProfile["gender"],
    activityLevel: d.activity_level as UserProfile["activityLevel"],
    disabilities: d.disabilities as string,
    weightGoal: d.weight_goal as UserProfile["weightGoal"],
    calorieGoal: d.calorie_goal as number,
    useRecommendedCalories: d.use_recommended_calories as boolean,
    hasCompletedOnboarding: d.has_completed_onboarding as boolean,
    createdAt: new Date(d.created_at as string).getTime(),
  };
}

export async function saveProfile(userId: string, p: UserProfile): Promise<void> {
  await sql.query(
    `insert into profiles
      (id, name, age, weight, height, gender, activity_level, disabilities,
       weight_goal, calorie_goal, use_recommended_calories, has_completed_onboarding, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())
     on conflict (id) do update set
       name = excluded.name,
       age = excluded.age,
       weight = excluded.weight,
       height = excluded.height,
       gender = excluded.gender,
       activity_level = excluded.activity_level,
       disabilities = excluded.disabilities,
       weight_goal = excluded.weight_goal,
       calorie_goal = excluded.calorie_goal,
       use_recommended_calories = excluded.use_recommended_calories,
       has_completed_onboarding = excluded.has_completed_onboarding,
       updated_at = now()`,
    [
      userId,
      p.name,
      p.age,
      p.weight,
      p.height,
      p.gender,
      p.activityLevel,
      p.disabilities,
      p.weightGoal,
      p.calorieGoal,
      p.useRecommendedCalories,
      p.hasCompletedOnboarding,
    ]
  );
}

// ── Settings (stored on the profile row) ──────────────────────

export async function getSettings(userId: string): Promise<UserSettings> {
  const rows = (await sql.query(
    `select voice_enabled, sensitivity, camera_facing from profiles where id = $1`,
    [userId]
  )) as Row[];
  const d = rows[0];
  if (!d) return DEFAULT_SETTINGS;
  return {
    voiceEnabled: d.voice_enabled as boolean,
    sensitivity: d.sensitivity as UserSettings["sensitivity"],
    cameraFacing: d.camera_facing as UserSettings["cameraFacing"],
    coachingMode: "ghost",
  };
}

export async function saveSettings(userId: string, s: UserSettings): Promise<void> {
  await sql.query(
    `update profiles set voice_enabled = $2, sensitivity = $3, camera_facing = $4, updated_at = now()
     where id = $1`,
    [userId, s.voiceEnabled, s.sensitivity, s.cameraFacing]
  );
}

// ── Workout Sessions ──────────────────────────────────────────

export async function getSessions(userId: string): Promise<WorkoutSession[]> {
  const rows = (await sql.query(
    `select * from workout_sessions where user_id = $1 order by start_time asc`,
    [userId]
  )) as Row[];
  return rows.map((d) => ({
    id: d.id as string,
    exercise: d.exercise as string,
    exerciseName: d.exercise_name as string,
    weight: d.weight != null ? Number(d.weight) : undefined,
    startTime: Number(d.start_time),
    endTime: d.end_time != null ? Number(d.end_time) : undefined,
    reps: d.reps as WorkoutSession["reps"],
    totalScore: d.total_score as number,
    caloriesBurned: Number(d.calories_burned),
    isRecorded: d.is_recorded as boolean,
  }));
}

export async function saveSession(userId: string, s: WorkoutSession): Promise<void> {
  await sql.query(
    `insert into workout_sessions
      (id, user_id, exercise, exercise_name, weight, start_time, end_time, reps, total_score, calories_burned, is_recorded)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict (id) do nothing`,
    [
      s.id,
      userId,
      s.exercise,
      s.exerciseName,
      s.weight ?? null,
      s.startTime,
      s.endTime ?? null,
      JSON.stringify(s.reps ?? []),
      s.totalScore,
      s.caloriesBurned,
      s.isRecorded ?? false,
    ]
  );
}

// ── Food Log ──────────────────────────────────────────────────

function mapFoodRow(d: Row): FoodEntry {
  return {
    id: d.id as string,
    name: d.name as string,
    calories: d.calories as number,
    protein: d.protein != null ? Number(d.protein) : undefined,
    carbs: d.carbs != null ? Number(d.carbs) : undefined,
    fat: d.fat != null ? Number(d.fat) : undefined,
    servingSize: d.serving_size != null ? Number(d.serving_size) : undefined,
    servingUnit: (d.serving_unit as string) ?? undefined,
    servings: d.servings != null ? Number(d.servings) : 1,
    date: d.date as string,
    timestamp: new Date(d.created_at as string).getTime(),
    meal: d.meal as FoodEntry["meal"],
  };
}

export async function getFoodLog(userId: string): Promise<FoodEntry[]> {
  const rows = (await sql.query(
    `select * from food_log where user_id = $1 order by created_at asc`,
    [userId]
  )) as Row[];
  return rows.map(mapFoodRow);
}

export async function addFoodEntry(userId: string, e: FoodEntry): Promise<void> {
  await sql.query(
    `insert into food_log
      (id, user_id, name, calories, protein, carbs, fat, serving_size, serving_unit, servings, date, meal)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     on conflict (id) do nothing`,
    [
      e.id,
      userId,
      e.name,
      e.calories,
      e.protein ?? null,
      e.carbs ?? null,
      e.fat ?? null,
      e.servingSize ?? null,
      e.servingUnit ?? null,
      e.servings ?? 1,
      e.date,
      e.meal ?? null,
    ]
  );
}

export async function deleteFoodEntry(userId: string, id: string): Promise<void> {
  await sql.query(`delete from food_log where id = $1 and user_id = $2`, [id, userId]);
}

// ── User Exercises ────────────────────────────────────────────

export async function getUserExercises(userId: string): Promise<UserExercise[]> {
  const rows = (await sql.query(
    `select * from user_exercises where user_id = $1 order by created_at asc`,
    [userId]
  )) as Row[];
  return rows.map((d) => ({
    id: d.id as string,
    name: d.name as string,
    trackingId: d.tracking_id as string,
    weight: d.weight != null ? Number(d.weight) : undefined,
    targetReps: (d.target_reps as number) ?? undefined,
    targetSets: (d.target_sets as number) ?? undefined,
    notes: (d.notes as string) ?? undefined,
    isCustom: d.is_custom as boolean,
    createdAt: new Date(d.created_at as string).getTime(),
  }));
}

export async function saveUserExercise(userId: string, ex: UserExercise): Promise<void> {
  await sql.query(
    `insert into user_exercises
      (id, user_id, name, tracking_id, weight, target_reps, target_sets, notes, is_custom)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     on conflict (id) do update set
       name = excluded.name,
       tracking_id = excluded.tracking_id,
       weight = excluded.weight,
       target_reps = excluded.target_reps,
       target_sets = excluded.target_sets,
       notes = excluded.notes,
       is_custom = excluded.is_custom`,
    [
      ex.id,
      userId,
      ex.name,
      ex.trackingId,
      ex.weight ?? null,
      ex.targetReps ?? null,
      ex.targetSets ?? null,
      ex.notes ?? null,
      ex.isCustom ?? false,
    ]
  );
}

export async function deleteUserExercise(userId: string, id: string): Promise<void> {
  await sql.query(`delete from user_exercises where id = $1 and user_id = $2`, [id, userId]);
}

// ── Streaks ───────────────────────────────────────────────────

const STREAK_FALLBACK: StreakData = {
  currentStreak: 0,
  bestStreak: 0,
  lastWorkoutDate: "",
  workoutDates: [],
};

export async function getStreakData(userId: string): Promise<StreakData> {
  const rows = (await sql.query(`select * from streaks where user_id = $1`, [userId])) as Row[];
  const d = rows[0];
  if (!d) return { ...STREAK_FALLBACK };
  return {
    currentStreak: d.current_streak as number,
    bestStreak: d.best_streak as number,
    lastWorkoutDate: d.last_workout_date as string,
    workoutDates: d.workout_dates as string[],
  };
}

export async function updateStreak(userId: string): Promise<StreakData> {
  const streak = await getStreakData(userId);
  const today = new Date().toISOString().split("T")[0];
  if (streak.lastWorkoutDate === today) return streak;

  if (!streak.workoutDates.includes(today)) streak.workoutDates.push(today);

  const lastDate = streak.lastWorkoutDate ? new Date(streak.lastWorkoutDate) : null;
  const todayDate = new Date(today);
  if (lastDate) {
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    streak.currentStreak = diffDays <= 3 ? streak.currentStreak + 1 : 1;
  } else {
    streak.currentStreak = 1;
  }
  streak.bestStreak = Math.max(streak.bestStreak, streak.currentStreak);
  streak.lastWorkoutDate = today;

  await sql.query(
    `insert into streaks (user_id, current_streak, best_streak, last_workout_date, workout_dates, updated_at)
     values ($1,$2,$3,$4,$5, now())
     on conflict (user_id) do update set
       current_streak = excluded.current_streak,
       best_streak = excluded.best_streak,
       last_workout_date = excluded.last_workout_date,
       workout_dates = excluded.workout_dates,
       updated_at = now()`,
    [
      userId,
      streak.currentStreak,
      streak.bestStreak,
      streak.lastWorkoutDate,
      JSON.stringify(streak.workoutDates),
    ]
  );
  return streak;
}

// ── Workout Routines ──────────────────────────────────────────

export async function getRoutines(userId: string): Promise<WorkoutRoutine[]> {
  const rows = (await sql.query(
    `select * from workout_routines where user_id = $1 order by created_at asc`,
    [userId]
  )) as Row[];
  return rows.map((d) => ({
    id: d.id as string,
    name: d.name as string,
    exercises: d.exercises as WorkoutRoutine["exercises"],
    createdAt: new Date(d.created_at as string).getTime(),
    updatedAt: new Date(d.updated_at as string).getTime(),
  }));
}

export async function saveRoutine(userId: string, r: WorkoutRoutine): Promise<void> {
  await sql.query(
    `insert into workout_routines (id, user_id, name, exercises, updated_at)
     values ($1,$2,$3,$4, now())
     on conflict (id) do update set
       name = excluded.name,
       exercises = excluded.exercises,
       updated_at = now()`,
    [r.id, userId, r.name, JSON.stringify(r.exercises ?? [])]
  );
}

export async function deleteRoutine(userId: string, id: string): Promise<void> {
  await sql.query(`delete from workout_routines where id = $1 and user_id = $2`, [id, userId]);
}

// ── Recordings (metadata only) ────────────────────────────────

export interface DbRecordingMeta {
  id: string;
  sessionId: string;
  exercise: string;
  exerciseName: string;
  reps: number;
  score: number;
  duration: number;
  size: number;
  storagePath: string | null;
  createdAt: number;
}

export async function getRecordings(userId: string): Promise<DbRecordingMeta[]> {
  const rows = (await sql.query(
    `select * from recordings where user_id = $1 order by created_at desc`,
    [userId]
  )) as Row[];
  return rows.map((d) => ({
    id: d.id as string,
    sessionId: (d.session_id as string) ?? "",
    exercise: d.exercise as string,
    exerciseName: d.exercise_name as string,
    reps: d.reps as number,
    score: d.score as number,
    duration: d.duration as number,
    size: d.size as number,
    storagePath: (d.storage_path as string) ?? null,
    createdAt: new Date(d.created_at as string).getTime(),
  }));
}

export async function saveRecordingMeta(
  userId: string,
  meta: Omit<DbRecordingMeta, "storagePath" | "createdAt"> & {
    createdAt: number;
    storagePath?: string | null;
  }
): Promise<void> {
  await sql.query(
    `insert into recordings
      (id, user_id, session_id, exercise, exercise_name, reps, score, duration, size, storage_path)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (id) do update set
       session_id = excluded.session_id,
       exercise = excluded.exercise,
       exercise_name = excluded.exercise_name,
       reps = excluded.reps,
       score = excluded.score,
       duration = excluded.duration,
       size = excluded.size,
       storage_path = excluded.storage_path`,
    [
      meta.id,
      userId,
      meta.sessionId ?? "",
      meta.exercise,
      meta.exerciseName,
      meta.reps,
      meta.score,
      meta.duration,
      meta.size,
      meta.storagePath ?? null,
    ]
  );
}

export async function deleteRecordingMeta(userId: string, id: string): Promise<void> {
  await sql.query(`delete from recordings where id = $1 and user_id = $2`, [id, userId]);
}
