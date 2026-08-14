"use client";

import { useMemo, useState } from "react";
import { buildHeatmap, fmtNum } from "@/lib/liftiq/demo-data";

type Cell = { date: Date; sets: number; volume: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Five-step intensity scale keyed on working-set count. */
function level(sets: number) {
  if (sets === 0) return 0;
  if (sets < 12) return 1;
  if (sets < 16) return 2;
  if (sets < 20) return 3;
  return 4;
}

const SHADES = [
  "rgba(255,255,255,0.04)",
  "rgba(182,242,58,0.18)",
  "rgba(182,242,58,0.36)",
  "rgba(182,242,58,0.6)",
  "rgba(182,242,58,0.9)",
];

export function TrainingHeatmap() {
  const cells = useMemo(() => buildHeatmap(52), []);
  const [hover, setHover] = useState<{ cell: Cell; x: number; y: number } | null>(null);

  // Chunk into week columns (each column is Sun → Sat).
  const weeks = useMemo(() => {
    const out: Cell[][] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cells]);

  const monthLabels = useMemo(() => {
    const labels: { index: number; label: string }[] = [];
    let last = -1;
    weeks.forEach((week, i) => {
      const m = week[0].date.getMonth();
      if (m !== last) {
        labels.push({ index: i, label: MONTHS[m] });
        last = m;
      }
    });
    return labels;
  }, [weeks]);

  const totals = useMemo(() => {
    const trained = cells.filter((c) => c.sets > 0);
    return {
      sessions: trained.length,
      volume: trained.reduce((n, c) => n + c.volume, 0),
    };
  }, [cells]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <p className="liq-eyebrow">Sessions</p>
          <p className="liq-num mt-1 text-[20px] font-semibold liq-t1">{totals.sessions}</p>
        </div>
        <div>
          <p className="liq-eyebrow">Total Volume</p>
          <p className="liq-num mt-1 text-[20px] font-semibold liq-t1">
            {fmtNum(totals.volume)}
            <span className="ml-1 text-[12px] font-medium liq-t3">lb</span>
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="relative inline-block min-w-full">
          {/* Month scale */}
          <div className="relative mb-1.5 ml-[26px] h-3">
            {monthLabels.map(({ index, label }) => (
              <span
                key={`${label}-${index}`}
                className="absolute text-[10px] liq-t3"
                style={{ left: index * 14 }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-1.5">
            {/* Weekday scale */}
            <div className="flex w-[20px] flex-col gap-[3px] pt-[1px]">
              {["", "M", "", "W", "", "F", ""].map((d, i) => (
                <span key={i} className="h-[11px] text-[9px] leading-[11px] liq-t3">
                  {d}
                </span>
              ))}
            </div>

            <div className="relative flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((cell, di) => (
                    <button
                      key={di}
                      onMouseEnter={(e) =>
                        setHover({
                          cell,
                          x: e.currentTarget.offsetLeft,
                          y: e.currentTarget.offsetTop,
                        })
                      }
                      onMouseLeave={() => setHover(null)}
                      aria-label={`${cell.date.toDateString()}: ${cell.sets} sets`}
                      className="h-[11px] w-[11px] rounded-[2.5px] transition-transform duration-150 hover:scale-125"
                      style={{ background: SHADES[level(cell.sets)] }}
                    />
                  ))}
                </div>
              ))}

              {hover && (
                <div
                  className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-xl border border-white/10 bg-[#191c22] px-3 py-2 shadow-2xl"
                  style={{ left: hover.x + 6, top: hover.y - 8 }}
                >
                  <p className="whitespace-nowrap text-[11.5px] font-semibold liq-t1">
                    {MONTHS[hover.cell.date.getMonth()]} {hover.cell.date.getDate()}
                  </p>
                  {hover.cell.sets > 0 ? (
                    <>
                      <p className="liq-num mt-0.5 whitespace-nowrap text-[11px] liq-t2">
                        {hover.cell.sets} working sets
                      </p>
                      <p className="liq-num whitespace-nowrap text-[11px] liq-t2">
                        {fmtNum(hover.cell.volume)} lb volume
                      </p>
                    </>
                  ) : (
                    <p className="mt-0.5 whitespace-nowrap text-[11px] liq-t3">Rest day</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <span className="text-[10.5px] liq-t3">Less</span>
        {SHADES.map((s) => (
          <span key={s} className="h-[11px] w-[11px] rounded-[2.5px]" style={{ background: s }} />
        ))}
        <span className="text-[10.5px] liq-t3">More</span>
      </div>
    </div>
  );
}
