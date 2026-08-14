"use client";

import { Moon, Activity, Gauge, CalendarCheck } from "lucide-react";
import { RECOVERY } from "@/lib/liftiq/demo-data";
import { Ring } from "./primitives";

const ROWS = [
  { icon: Moon, label: "Sleep", value: RECOVERY.sleep },
  { icon: Activity, label: "Muscle Fatigue", value: RECOVERY.muscleFatigue },
  { icon: Gauge, label: "Training Load", value: RECOVERY.trainingLoad },
  { icon: CalendarCheck, label: "Rest Recommendation", value: `${RECOVERY.restDays} days` },
];

export function RecoveryScore({ compact = false }: { compact?: boolean }) {
  const color = RECOVERY.score >= 70 ? "#b6f23a" : RECOVERY.score >= 45 ? "#f5b544" : "#e0655f";

  return (
    <div className="flex flex-col items-center">
      <Ring value={RECOVERY.score} size={compact ? 120 : 140} stroke={9} color={color}>
        <span className="liq-num text-[32px] font-semibold leading-none liq-t1">
          {RECOVERY.score}
          <span className="text-[16px] font-medium liq-t3">%</span>
        </span>
        <span className="liq-eyebrow mt-1.5">Recovery</span>
      </Ring>

      <p className="mt-4 text-[14px] font-semibold" style={{ color }}>
        {RECOVERY.status}
      </p>

      <dl className="mt-5 w-full space-y-0">
        {ROWS.map(({ icon: Icon, label, value }, i) => (
          <div
            key={label}
            className={`flex items-center justify-between py-2.5 ${
              i > 0 ? "border-t border-white/[0.06]" : ""
            }`}
          >
            <dt className="flex items-center gap-2 text-[12.5px] liq-t2">
              <Icon size={14} className="text-[#6b7280]" />
              {label}
            </dt>
            <dd className="liq-num text-[12.5px] font-semibold liq-t1">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
