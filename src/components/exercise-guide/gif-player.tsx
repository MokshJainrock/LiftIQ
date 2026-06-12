/** @deprecated Use exercise-demo-player instead */
import { cn } from "@/lib/utils";
import {
  ExerciseDemoPlayer,
  preloadExerciseDemo,
  type ExerciseDemoPlayerProps,
} from "./exercise-demo-player";

export type GifPlayerProps = ExerciseDemoPlayerProps & { src?: string };

export const preloadGif = preloadExerciseDemo;

export function GifPlayer({ src, gifSrc, ...props }: GifPlayerProps) {
  return <ExerciseDemoPlayer gifSrc={gifSrc ?? src} {...props} />;
}

export function GifPoster({ className }: { src?: string; className?: string }) {
  return <div className={cn("w-full h-full bg-[#0a0a0f]", className)} />;
}

export function LazyGifPlayer({ src, ...props }: GifPlayerProps) {
  return <ExerciseDemoPlayer gifSrc={src} {...props} />;
}
