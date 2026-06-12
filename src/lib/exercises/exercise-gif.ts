import gifMap from "@/lib/exercises/exercise-gif-map.json";
import { findLibraryByKey, findLibraryExerciseByName } from "@/lib/exercises/library";

export interface ExerciseGifEntry {
  gifUrl: string;
  sourceName: string;
  score: number;
  instructions?: string[];
}

type GifMap = Record<string, ExerciseGifEntry | null>;

const MAP = gifMap as GifMap;

export function resolveExerciseGif(exerciseId?: string, exerciseName?: string): ExerciseGifEntry | null {
  const lib =
    (exerciseId ? findLibraryByKey(exerciseId) : undefined) ??
    (exerciseName ? findLibraryExerciseByName(exerciseName) : undefined);

  const id =
    lib?.id ??
    exerciseId ??
    (exerciseName
      ? exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : undefined);

  if (!id) return null;
  return MAP[id] ?? null;
}
