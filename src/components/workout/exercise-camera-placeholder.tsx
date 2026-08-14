"use client";

import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseCameraPlaceholderProps {
  mobile?: boolean;
}

export function ExerciseCameraPlaceholder({ mobile = false }: ExerciseCameraPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-[#040408] text-center px-6 border border-white/[0.07] rounded-2xl",
        mobile ? "min-h-[min(50vh,420px)] flex-1" : "aspect-video min-h-[260px] w-full",
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.08]">
        <Camera className="h-7 w-7 text-primary" strokeWidth={1.5} />
      </div>
      <p className="max-w-[280px] text-sm font-medium text-zinc-200">
        Choose an exercise below
      </p>
      <p className="mt-1.5 max-w-[260px] text-xs text-zinc-500">
        The camera turns on after you select a workout so we only access it when you&apos;re ready.
      </p>
    </div>
  );
}
