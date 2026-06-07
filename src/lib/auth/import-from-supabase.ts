import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as neon from "@/lib/neon/queries";
import { sql } from "@/lib/neon/client";
import {
  UserProfile,
  UserSettings,
  WorkoutSession,
  FoodEntry,
  UserExercise,
  WorkoutRoutine,
} from "@/types";

type Row = Record<string, unknown>;

/**
 * One-time, best-effort copy of a user's existing Supabase data into Neon when
 * they first migrate. Idempotent (all upserts/conflict-ignore), so re-running
 * is safe. Each table is independent — a failure on one doesn't abort the rest.
 */
export async function importSupabaseData(
  supabase: SupabaseClient,
  supabaseUserId: string,
  neonUserId: string
): Promise<void> {
  // Profile + settings
  try {
    const { data } = await supabase.from("profiles").select("*").eq("id", supabaseUserId).single();
    if (data) {
      const d = data as Row;
      const profile: UserProfile = {
        name: (d.name as string) ?? "",
        age: (d.age as number) ?? 0,
        weight: Number(d.weight ?? 0),
        height: (d.height as number) ?? 0,
        gender: (d.gender as UserProfile["gender"]) ?? "male",
        activityLevel: (d.activity_level as UserProfile["activityLevel"]) ?? "moderate",
        disabilities: (d.disabilities as string) ?? "",
        weightGoal: (d.weight_goal as UserProfile["weightGoal"]) ?? "maintain",
        calorieGoal: (d.calorie_goal as number) ?? 2000,
        useRecommendedCalories: (d.use_recommended_calories as boolean) ?? true,
        hasCompletedOnboarding: (d.has_completed_onboarding as boolean) ?? false,
        createdAt: Date.now(),
      };
      await neon.saveProfile(neonUserId, profile);
      const settings: UserSettings = {
        voiceEnabled: (d.voice_enabled as boolean) ?? false,
        sensitivity: (d.sensitivity as UserSettings["sensitivity"]) ?? "medium",
        cameraFacing: (d.camera_facing as UserSettings["cameraFacing"]) ?? "user",
        coachingMode: "ghost",
      };
      await neon.saveSettings(neonUserId, settings);
    }
  } catch (e) {
    console.warn("[import] profile:", e);
  }

  // Workout sessions
  try {
    const { data } = await supabase.from("workout_sessions").select("*").eq("user_id", supabaseUserId);
    for (const d of (data ?? []) as Row[]) {
      const session: WorkoutSession = {
        id: d.id as string,
        exercise: d.exercise as string,
        exerciseName: d.exercise_name as string,
        weight: d.weight != null ? Number(d.weight) : undefined,
        startTime: Number(d.start_time),
        endTime: d.end_time != null ? Number(d.end_time) : undefined,
        reps: d.reps as WorkoutSession["reps"],
        totalScore: (d.total_score as number) ?? 0,
        caloriesBurned: Number(d.calories_burned ?? 0),
        isRecorded: (d.is_recorded as boolean) ?? false,
      };
      await neon.saveSession(neonUserId, session);
    }
  } catch (e) {
    console.warn("[import] sessions:", e);
  }

  // Food log
  try {
    const { data } = await supabase.from("food_log").select("*").eq("user_id", supabaseUserId);
    for (const d of (data ?? []) as Row[]) {
      const entry: FoodEntry = {
        id: d.id as string,
        name: d.name as string,
        calories: (d.calories as number) ?? 0,
        protein: d.protein != null ? Number(d.protein) : undefined,
        carbs: d.carbs != null ? Number(d.carbs) : undefined,
        fat: d.fat != null ? Number(d.fat) : undefined,
        servingSize: d.serving_size != null ? Number(d.serving_size) : undefined,
        servingUnit: (d.serving_unit as string) ?? undefined,
        servings: d.servings != null ? Number(d.servings) : 1,
        date: d.date as string,
        timestamp: Date.now(),
        meal: d.meal as FoodEntry["meal"],
      };
      await neon.addFoodEntry(neonUserId, entry);
    }
  } catch (e) {
    console.warn("[import] food:", e);
  }

  // User exercises
  try {
    const { data } = await supabase.from("user_exercises").select("*").eq("user_id", supabaseUserId);
    for (const d of (data ?? []) as Row[]) {
      const ex: UserExercise = {
        id: d.id as string,
        name: d.name as string,
        trackingId: (d.tracking_id as string) ?? "custom",
        weight: d.weight != null ? Number(d.weight) : undefined,
        targetReps: (d.target_reps as number) ?? undefined,
        targetSets: (d.target_sets as number) ?? undefined,
        notes: (d.notes as string) ?? undefined,
        isCustom: (d.is_custom as boolean) ?? false,
        createdAt: Date.now(),
      };
      await neon.saveUserExercise(neonUserId, ex);
    }
  } catch (e) {
    console.warn("[import] exercises:", e);
  }

  // Streaks
  try {
    const { data } = await supabase.from("streaks").select("*").eq("user_id", supabaseUserId).single();
    if (data) {
      const d = data as Row;
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
          neonUserId,
          (d.current_streak as number) ?? 0,
          (d.best_streak as number) ?? 0,
          (d.last_workout_date as string) ?? "",
          JSON.stringify((d.workout_dates as string[]) ?? []),
        ]
      );
    }
  } catch (e) {
    console.warn("[import] streaks:", e);
  }

  // Workout routines
  try {
    const { data } = await supabase.from("workout_routines").select("*").eq("user_id", supabaseUserId);
    for (const d of (data ?? []) as Row[]) {
      const routine: WorkoutRoutine = {
        id: d.id as string,
        name: d.name as string,
        exercises: d.exercises as WorkoutRoutine["exercises"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await neon.saveRoutine(neonUserId, routine);
    }
  } catch (e) {
    console.warn("[import] routines:", e);
  }

  // Recordings metadata (video blobs remain in Supabase storage / local cache)
  try {
    const { data } = await supabase.from("recordings").select("*").eq("user_id", supabaseUserId);
    for (const d of (data ?? []) as Row[]) {
      await neon.saveRecordingMeta(neonUserId, {
        id: d.id as string,
        sessionId: (d.session_id as string) ?? "",
        exercise: d.exercise as string,
        exerciseName: d.exercise_name as string,
        reps: (d.reps as number) ?? 0,
        score: (d.score as number) ?? 0,
        duration: (d.duration as number) ?? 0,
        size: (d.size as number) ?? 0,
        storagePath: (d.storage_path as string) ?? null,
        createdAt: Date.now(),
      });
    }
  } catch (e) {
    console.warn("[import] recordings:", e);
  }
}
