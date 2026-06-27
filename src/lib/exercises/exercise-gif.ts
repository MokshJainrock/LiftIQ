import gifMap from "@/lib/exercises/exercise-gif-map.json";
import { findLibraryByKey, findLibraryExerciseByName } from "@/lib/exercises/library";
import { resolveExercisePlaceholder } from "@/lib/exercises/exercise-placeholder";

export interface ExerciseGifEntry {
  gifUrl: string;
  /** Local MP4 loop (~15s), generated from gif via npm run generate:videos */
  videoUrl?: string;
  /** Static JPEG poster — derived from videoUrl if omitted */
  posterUrl?: string;
  sourceName: string;
  score: number;
  instructions?: string[];
}

export function posterUrlForMedia(entry: Pick<ExerciseGifEntry, "videoUrl" | "posterUrl" | "gifUrl"> | null | undefined) {
  if (!entry) return undefined;
  return entry.posterUrl ?? entry.videoUrl?.replace(/\.mp4$/i, ".jpg") ?? entry.gifUrl;
}

/** Best static image for thumbnails — never returns empty. */
export function resolveStaticExerciseImage(
  exerciseId?: string,
  exerciseName?: string,
): string {
  const media = resolveExerciseGif(exerciseId, exerciseName);
  return posterUrlForMedia(media) ?? resolveExercisePlaceholder(exerciseId, exerciseName);
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
