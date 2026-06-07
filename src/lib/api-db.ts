// Client-side data access layer. Talks to the Neon-backed API routes (primary
// DB) over same-origin fetch; the session cookie authenticates each request.
// Mirrors the function names/signatures of the old supabase-db module so the
// rest of the app (storage/index.ts, recordings-db.ts) is unchanged.
import {
  UserProfile,
  UserSettings,
  WorkoutSession,
  FoodEntry,
  UserExercise,
  StreakData,
  WorkoutRoutine,
} from "@/types";

async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

async function postJson(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function del(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "DELETE", credentials: "same-origin" });
    return res.ok;
  } catch {
    return false;
  }
}

const today = () => new Date().toISOString().split("T")[0];

// ── Profile ───────────────────────────────────────────────────

export async function dbGetProfile(): Promise<UserProfile | null> {
  const { profile } = await getJson<{ profile: UserProfile | null }>("/api/data/profile", {
    profile: null,
  });
  return profile;
}

export async function dbSaveProfile(profile: UserProfile): Promise<void> {
  await postJson("/api/data/profile", profile);
}

export async function dbHasCompletedOnboarding(): Promise<boolean> {
  const profile = await dbGetProfile();
  return profile?.hasCompletedOnboarding ?? false;
}

// ── Settings ──────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  voiceEnabled: false,
  sensitivity: "medium",
  cameraFacing: "user",
  coachingMode: "ghost",
};

export async function dbGetSettings(): Promise<UserSettings> {
  const { settings } = await getJson<{ settings: UserSettings }>("/api/data/settings", {
    settings: DEFAULT_SETTINGS,
  });
  return settings ?? DEFAULT_SETTINGS;
}

export async function dbSaveSettings(settings: UserSettings): Promise<void> {
  await postJson("/api/data/settings", settings);
}

// ── Workout Sessions ──────────────────────────────────────────

export async function dbGetSessions(): Promise<WorkoutSession[]> {
  const { sessions } = await getJson<{ sessions: WorkoutSession[] }>("/api/data/sessions", {
    sessions: [],
  });
  return sessions ?? [];
}

export async function dbSaveSession(session: WorkoutSession): Promise<void> {
  await postJson("/api/data/sessions", session);
}

// ── Food Log ──────────────────────────────────────────────────

export async function dbGetFoodLog(): Promise<FoodEntry[]> {
  const { food } = await getJson<{ food: FoodEntry[] }>("/api/data/food", { food: [] });
  return food ?? [];
}

export async function dbAddFoodEntry(entry: FoodEntry): Promise<void> {
  await postJson("/api/data/food", entry);
}

export async function dbDeleteFoodEntry(id: string): Promise<void> {
  await del(`/api/data/food?id=${encodeURIComponent(id)}`);
}

export async function dbGetTodayFoodCalories(): Promise<number> {
  const log = await dbGetFoodLog();
  return log.filter((e) => e.date === today()).reduce((sum, e) => sum + e.calories, 0);
}

export async function dbGetTodayFoodEntries(): Promise<FoodEntry[]> {
  const log = await dbGetFoodLog();
  return log.filter((e) => e.date === today());
}

// ── User Exercises ────────────────────────────────────────────

export async function dbGetUserExercises(): Promise<UserExercise[]> {
  const { exercises } = await getJson<{ exercises: UserExercise[] }>("/api/data/exercises", {
    exercises: [],
  });
  return exercises ?? [];
}

export async function dbSaveUserExercise(exercise: UserExercise): Promise<void> {
  await postJson("/api/data/exercises", exercise);
}

export async function dbDeleteUserExercise(id: string): Promise<void> {
  await del(`/api/data/exercises?id=${encodeURIComponent(id)}`);
}

// ── Streaks ───────────────────────────────────────────────────

const STREAK_FALLBACK: StreakData = {
  currentStreak: 0,
  bestStreak: 0,
  lastWorkoutDate: "",
  workoutDates: [],
};

export async function dbGetStreakData(): Promise<StreakData> {
  const { streak } = await getJson<{ streak: StreakData }>("/api/data/streak", {
    streak: STREAK_FALLBACK,
  });
  return streak ?? STREAK_FALLBACK;
}

export async function dbUpdateStreak(): Promise<StreakData> {
  try {
    const res = await fetch("/api/data/streak", { method: "POST", credentials: "same-origin" });
    if (!res.ok) return STREAK_FALLBACK;
    const { streak } = (await res.json()) as { streak: StreakData };
    return streak ?? STREAK_FALLBACK;
  } catch {
    return STREAK_FALLBACK;
  }
}

// ── Workout Routines ──────────────────────────────────────────

export async function dbGetRoutines(): Promise<WorkoutRoutine[]> {
  const { routines } = await getJson<{ routines: WorkoutRoutine[] }>("/api/data/routines", {
    routines: [],
  });
  return routines ?? [];
}

export async function dbSaveRoutine(routine: WorkoutRoutine): Promise<void> {
  await postJson("/api/data/routines", routine);
}

export async function dbDeleteRoutine(id: string): Promise<void> {
  await del(`/api/data/routines?id=${encodeURIComponent(id)}`);
}

// ── Recordings ───────────────────────────────────────────────
// Video blobs live in the browser's IndexedDB; only metadata syncs to Neon.

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

export async function dbUploadRecording(
  meta: Omit<DbRecordingMeta, "storagePath" | "createdAt"> & { createdAt: number },
  _blob: Blob
): Promise<void> {
  void _blob; // blob is persisted locally by the caller (IndexedDB)
  await postJson("/api/data/recordings", { ...meta, storagePath: null });
}

export async function dbGetRecordings(): Promise<DbRecordingMeta[]> {
  const { recordings } = await getJson<{ recordings: DbRecordingMeta[] }>("/api/data/recordings", {
    recordings: [],
  });
  return recordings ?? [];
}

// No remote blob store for Neon — local IndexedDB cache is the source for playback.
export async function dbGetRecordingBlob(_storagePath: string): Promise<Blob | null> {
  void _storagePath;
  return null;
}

export async function dbDeleteRecording(id: string, _storagePath: string | null): Promise<void> {
  void _storagePath;
  await del(`/api/data/recordings?id=${encodeURIComponent(id)}`);
}
