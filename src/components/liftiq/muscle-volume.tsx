"use client";

import type { VolumeStatus } from "@/lib/liftiq/demo-data";
import { Bar, Pill, type PillTone } from "./primitives";

const STATUS: Record<VolumeStatus, { label: string; tone: PillTone; color: string }> = {
  optimal: { label: "Optimal", tone: "accent", color: "#b6f23a" },
  low: { label: "Low", tone: "warn", color: "#f5b544" },
  high: { label: "High", tone: "danger", color: "#e0655f" },
};

export function MuscleVolume({
  rows,
  max,
}: {
  rows: { muscle: string; sets: number; target: number; status: VolumeStatus }[];
  max?: number;
}) {
  const ceiling = max ?? Math.max(...rows.map((r) => Math.max(r.sets, r.target))) + 2;

  return (
    <ul className="space-y-3.5">
      {rows.map((row, i) => {
        const meta = STATUS[row.status];
        return (
          <li key={row.muscle}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-medium liq-t1">{row.muscle}</span>
              <span className="flex items-center gap-2.5">
                <span className="liq-num text-[13px] font-semibold liq-t1">
                  {row.sets}
                  <span className="ml-1 text-[11px] font-normal liq-t3">sets</span>
                </span>
                <Pill tone={meta.tone}>{meta.label}</Pill>
              </span>
            </div>
            <div className="relative">
              <Bar value={row.sets} max={ceiling} color={meta.color} delay={i * 0.04} />
              {/* Target marker */}
              <span
                className="absolute top-1/2 h-2.5 w-[1.5px] -translate-y-1/2 rounded-full bg-white/25"
                style={{ left: `${(row.target / ceiling) * 100}%` }}
                title={`Target ${row.target} sets`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
