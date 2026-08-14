"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Personal record row. Celebratory via a single accent glow on the newest PR —
 * no confetti.
 */
export function PRCard({
  lift,
  value,
  delta,
  date,
  featured = false,
}: {
  lift: string;
  value: string;
  delta: string;
  date: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3.5 transition-colors duration-150",
        featured
          ? "liq-pr-glow border-[#b6f23a]/25 bg-[#b6f23a]/[0.04]"
          : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.13]"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
          featured ? "bg-[#b6f23a]/14 text-[#b6f23a]" : "bg-white/[0.05] text-[#9ca3af]"
        )}
      >
        <Trophy size={15} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium liq-t1">{lift}</p>
        <p className="text-[11.5px] liq-t3">{date}</p>
      </div>

      <div className="text-right">
        <p className="liq-num text-[15px] font-semibold liq-t1">{value}</p>
        <p className="liq-num text-[11.5px] font-medium text-[#b6f23a]">{delta}</p>
      </div>
    </div>
  );
}
