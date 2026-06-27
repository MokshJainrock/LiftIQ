"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SetupCheckItem } from "@/lib/pose/tracking-confidence";

interface SetupValidationOverlayProps {
  progress: number;
  hint: string;
  checklist: SetupCheckItem[];
  ready: boolean;
}

export function SetupValidationOverlay({
  progress,
  hint,
  checklist,
  ready,
}: SetupValidationOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 z-30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="relative mx-auto mb-4 h-14 w-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30" />
            <ScanLine className="h-7 w-7 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-sm font-bold uppercase tracking-[0.15em] text-cyan-400 mb-1">
            AI Setup Validation
          </div>
          <p className="text-xs text-white/75 min-h-[1.25rem]">{hint || "Get into the starting position"}</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-md p-4 space-y-2 mb-4">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-2.5 rounded-xl px-3 py-2 text-xs",
                item.ok ? "bg-emerald-500/[0.06]" : "bg-white/[0.03]",
              )}
            >
              {item.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className={cn("font-medium", item.ok ? "text-emerald-300" : "text-zinc-300")}>
                  {item.label}
                </div>
                {!item.ok && item.hint && (
                  <div className="text-[10px] text-zinc-500 mt-0.5">{item.hint}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
        <div className="text-center text-[10px] text-white/40 tabular-nums">
          {ready ? "Ready to score reps!" : progress < 100 ? `${progress}% locked in` : "Almost there…"}
        </div>

        <p className="text-[9px] text-center text-zinc-600 mt-4 leading-relaxed">
          Uses rear camera + pose AI. Score appears only at high confidence — reps always count.
        </p>
      </div>
    </div>
  );
}
