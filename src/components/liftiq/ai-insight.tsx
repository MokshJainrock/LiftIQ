"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Coaching insight. Reads as a system recommendation rather than a chat bubble:
 * flat surface, thin accent rule, no avatar, no speech tail.
 */
export function AIInsight({
  title,
  body,
  tone = "neutral",
  action,
  className,
}: {
  title: string;
  body: ReactNode;
  tone?: "neutral" | "good" | "warn";
  action?: ReactNode;
  className?: string;
}) {
  const accent = {
    neutral: "#b6f23a",
    good: "#7dd88f",
    warn: "#f5b544",
  }[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-4",
        className
      )}
    >
      <span className="absolute inset-y-0 left-0 w-[2px]" style={{ background: accent }} />

      <div className="flex items-start gap-3 pl-1.5">
        <Sparkles size={15} className="mt-0.5 shrink-0" style={{ color: accent }} />
        <div className="min-w-0 flex-1">
          <p className="liq-eyebrow mb-1.5">Lift IQ Insight</p>
          <p className="text-[13.5px] font-semibold leading-snug liq-t1">{title}</p>
          <div className="mt-1.5 text-[13px] leading-relaxed liq-t2">{body}</div>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}
