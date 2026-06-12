import { MUSCLE_VISUALS, MuscleGroup } from "@/lib/exercises/library";
import { cn } from "@/lib/utils";

/**
 * Small visual tile for an exercise — muscle-group emoji on a colored
 * gradient. Used in lists so every exercise has an identity at a glance.
 */
export function ExerciseIcon({
  muscle,
  size = "md",
  className,
}: {
  muscle: MuscleGroup | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const visual = MUSCLE_VISUALS[muscle as MuscleGroup] ?? MUSCLE_VISUALS["full-body"];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-gradient-to-br select-none",
        visual.gradient,
        size === "sm" && "h-8 w-8 text-base rounded-lg",
        size === "md" && "h-10 w-10 text-lg",
        size === "lg" && "h-12 w-12 text-2xl",
        className,
      )}
    >
      {visual.emoji}
    </span>
  );
}
