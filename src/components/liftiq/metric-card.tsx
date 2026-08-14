"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "./primitives";

/**
 * Headline metric tile. The number is the visual anchor; supporting label,
 * delta and an optional visual (sparkline / ring / icon) sit around it.
 */
export function MetricCard({
  label,
  value,
  unit,
  delta,
  footnote,
  icon,
  visual,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: ReactNode;
  footnote?: ReactNode;
  icon?: ReactNode;
  visual?: ReactNode;
  className?: string;
}) {
  return (
    <Card hover className={cn("flex flex-col justify-between gap-4 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="liq-eyebrow">{label}</p>
        {icon && <span className="liq-t3">{icon}</span>}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="liq-num flex items-baseline gap-1 text-[30px] font-semibold leading-none liq-t1">
            {value}
            {unit && <span className="text-[15px] font-medium liq-t3">{unit}</span>}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {delta}
            {footnote && <span className="text-[12px] liq-t3">{footnote}</span>}
          </div>
        </div>
        {visual && <div className="shrink-0">{visual}</div>}
      </div>
    </Card>
  );
}
