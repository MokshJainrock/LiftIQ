"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  LIFTS,
  LIFT_ORDER,
  RANGES,
  RANGE_LABELS,
  liftSeries,
  seriesChangePct,
  type LiftKey,
  type Range,
} from "@/lib/liftiq/demo-data";
import { Card, CardHeader, Delta, Segmented } from "./primitives";
import { ProgressChart } from "./progress-chart";

function LiftPicker({ value, onChange }: { value: LiftKey; onChange: (v: LiftKey) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 rounded-[10px] border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[12.5px] font-medium liq-t1 transition-colors duration-150 hover:border-white/[0.13] hover:bg-white/[0.06]"
      >
        {LIFTS[value].name}
        <ChevronDown
          size={14}
          className={`text-[#6b7280] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-40 mt-1.5 w-[188px] origin-top-right overflow-hidden rounded-xl border border-white/[0.09] bg-[#191c22] p-1 shadow-2xl"
          style={{ animation: "fadeIn 140ms ease-out" }}
        >
          {LIFT_ORDER.map((key) => (
            <button
              key={key}
              role="option"
              aria-selected={key === value}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors duration-150 hover:bg-white/[0.06]"
            >
              <span className={key === value ? "liq-t1" : "liq-t2"}>{LIFTS[key].name}</span>
              {key === value && <Check size={13} className="text-[#b6f23a]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StrengthProgressCard({ height = 268 }: { height?: number }) {
  const [lift, setLift] = useState<LiftKey>("bench");
  const [range, setRange] = useState<Range>("6M");

  const series = liftSeries(lift, range).map((p) => ({ label: p.label, value: p.value }));
  const changePct = seriesChangePct(series);

  return (
    <Card className="p-5 md:p-6">
      <CardHeader
        title="Strength Progress"
        subtitle="Estimated 1RM progression"
        action={<LiftPicker value={lift} onChange={setLift} />}
      />

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="liq-eyebrow">Current Estimated 1RM</p>
          <p className="liq-num mt-1.5 flex items-baseline gap-1.5 text-[36px] font-semibold leading-none liq-t1">
            {LIFTS[lift].current}
            <span className="text-[16px] font-medium liq-t3">lb</span>
          </p>
          <div className="mt-2">
            <Delta value={changePct} suffix={RANGE_LABELS[range]} />
          </div>
        </div>
        <Segmented options={RANGES} value={range} onChange={setRange} />
      </div>

      <div className="mt-4">
        <ProgressChart data={series} height={height} id={`strength-${lift}-${range}`} />
      </div>
    </Card>
  );
}
