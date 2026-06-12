"use client";

import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

/** Lightweight static human thumbnail for grids and icons. */
export function ExerciseDemoPoster({
  posterSrc,
  gifFallback,
  className,
  eager = false,
}: {
  posterSrc?: string;
  gifFallback?: string;
  className?: string;
  eager?: boolean;
}) {
  const [src, setSrc] = useState(posterSrc ?? gifFallback);

  useEffect(() => {
    setSrc(posterSrc ?? gifFallback);
  }, [posterSrc, gifFallback]);

  if (!src) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-[#050508]", className)}>
        <Dumbbell className="h-5 w-5 text-zinc-700" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => {
        if (gifFallback && src !== gifFallback) setSrc(gifFallback);
      }}
      className={cn(
        "h-full w-full object-contain object-center bg-[#050508]",
        className,
      )}
    />
  );
}
