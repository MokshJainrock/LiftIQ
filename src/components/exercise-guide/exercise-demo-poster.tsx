"use client";

import { useEffect, useMemo, useState } from "react";
import { ExerciseDemoFallback } from "@/components/exercise-guide/exercise-demo-fallback";
import { resolveStaticExerciseImage } from "@/lib/exercises/exercise-gif";
import { cn } from "@/lib/utils";

/** Lightweight static human thumbnail for grids and icons — never renders empty. */
export function ExerciseDemoPoster({
  posterSrc,
  gifFallback,
  exerciseId,
  exerciseName,
  className,
  eager = false,
}: {
  posterSrc?: string;
  gifFallback?: string;
  exerciseId?: string;
  exerciseName?: string;
  className?: string;
  eager?: boolean;
}) {
  const placeholder = useMemo(
    () => resolveStaticExerciseImage(exerciseId, exerciseName),
    [exerciseId, exerciseName],
  );

  const sources = useMemo(() => {
    const chain = [posterSrc, gifFallback, placeholder].filter(
      (u, i, arr): u is string => !!u && arr.indexOf(u) === i,
    );
    return chain.length > 0 ? chain : [placeholder];
  }, [posterSrc, gifFallback, placeholder]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [failedAll, setFailedAll] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setFailedAll(false);
  }, [sources]);

  if (failedAll || sourceIndex >= sources.length) {
    return (
      <ExerciseDemoFallback
        exerciseId={exerciseId}
        exerciseName={exerciseName}
        className={className}
        width={undefined}
        height={undefined}
      />
    );
  }

  const src = sources[sourceIndex];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => {
        if (sourceIndex + 1 < sources.length) {
          setSourceIndex((i) => i + 1);
        } else {
          setFailedAll(true);
        }
      }}
      className={cn(
        "h-full w-full object-contain object-center bg-[#050508]",
        className,
      )}
    />
  );
}
