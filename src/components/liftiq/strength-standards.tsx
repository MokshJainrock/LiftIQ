"use client";

import { LIFTS, type LiftKey } from "@/lib/liftiq/demo-data";

/**
 * Places the lifter on the beginner → elite scale. Segments are proportional to
 * the real strength-standard gaps rather than evenly spaced, so the marker
 * position is honest.
 */
export function StrengthStandards({ liftKey }: { liftKey: LiftKey }) {
  const lift = LIFTS[liftKey];
  const bands = lift.standards;
  const min = bands[0].value;
  const max = bands[bands.length - 1].value * 1.12;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const markerPct = Math.max(2, Math.min(98, pct(lift.current)));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium liq-t1">{lift.name}</p>
          <p className="liq-num mt-1 text-[24px] font-semibold leading-none liq-t1">
            {lift.current}
            <span className="ml-1 text-[13px] font-medium liq-t3">lb</span>
          </p>
        </div>
        <span className="rounded-full border border-[#b6f23a]/25 bg-[#b6f23a]/[0.1] px-2.5 py-1 text-[11.5px] font-semibold text-[#b6f23a]">
          {lift.level}
        </span>
      </div>

      <div className="relative mt-5">
        {/* Band track */}
        <div className="flex h-1.5 overflow-hidden rounded-full">
          {bands.map((band, i) => {
            const next = bands[i + 1]?.value ?? max;
            const width = pct(next) - pct(band.value);
            const reached = lift.current >= band.value;
            return (
              <span
                key={band.label}
                style={{
                  width: `${width}%`,
                  background: reached ? `rgba(182,242,58,${0.3 + i * 0.16})` : "rgba(255,255,255,0.06)",
                }}
                className="border-r border-[#15171c] last:border-0"
              />
            );
          })}
        </div>

        {/* Position marker */}
        <div
          className="absolute -top-1 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${markerPct}%` }}
        >
          <span className="h-3.5 w-[3px] rounded-full bg-[#f7f7f8] shadow-[0_0_8px_rgba(247,247,248,0.5)]" />
        </div>

        {/* Band labels */}
        <div className="relative mt-2.5 h-4">
          {bands.map((band, i) => {
            const next = bands[i + 1]?.value ?? max;
            const center = pct(band.value) + (pct(next) - pct(band.value)) / 2;
            const reached = lift.current >= band.value;
            return (
              <span
                key={band.label}
                className={`absolute -translate-x-1/2 whitespace-nowrap text-[10px] ${
                  reached ? "liq-t2" : "liq-t3"
                }`}
                style={{ left: `${center}%` }}
              >
                {band.label}
              </span>
            );
          })}
        </div>
      </div>

      <p className="mt-5 text-[12.5px] liq-t2">
        <span className="liq-num font-semibold liq-t1">
          {bands[bands.length - 1].value - lift.current} lb
        </span>{" "}
        from the elite threshold for a {LIFTS[liftKey].name.toLowerCase()} at your bodyweight.
      </p>
    </div>
  );
}
