"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartPoint = { label: string; value: number };

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-[#191c22]/95 px-3 py-2 shadow-2xl backdrop-blur">
      <p className="liq-eyebrow mb-0.5">{point.label}</p>
      <p className="liq-num text-[15px] font-semibold liq-t1">
        {point.value.toLocaleString("en-US")}
        {unit ? <span className="ml-1 text-[11px] font-medium liq-t3">{unit}</span> : null}
      </p>
    </div>
  );
}

/**
 * Rounded axis scale — picks a human step (5, 10, 25, …) so ticks land on
 * readable values instead of whatever the raw data range produces.
 */
function niceScale(min: number, max: number, targetTicks = 5) {
  const span = Math.max(max - min, 1);
  const rough = (span * 1.6) / (targetTicks - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;

  const start = Math.floor((min - span * 0.15) / step) * step;
  const end = Math.ceil((max + span * 0.15) / step) * step;

  const ticks: number[] = [];
  for (let t = start; t <= end + step / 2; t += step) ticks.push(Math.round(t * 100) / 100);

  return { domain: [start, end] as [number, number], ticks };
}

/**
 * Smooth gradient area chart used for every strength/volume trend.
 */
export function ProgressChart({
  data,
  height = 260,
  color = "#b6f23a",
  unit = "lb",
  showGrid = true,
  showAxis = true,
  id = "liq-chart",
}: {
  data: ChartPoint[];
  height?: number;
  color?: string;
  unit?: string;
  showGrid?: boolean;
  showAxis?: boolean;
  id?: string;
}) {
  const values = data.map((d) => d.value);
  const scale = niceScale(Math.min(...values), Math.max(...values));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: showAxis ? -18 : 0 }}>
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {showGrid && (
            <CartesianGrid
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="3 6"
              vertical={false}
            />
          )}

          {showAxis && (
            <>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                domain={scale.domain}
                ticks={scale.ticks}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickFormatter={(v: number) => v.toLocaleString("en-US")}
                width={52}
              />
            </>
          )}

          <Tooltip
            content={<ChartTooltip unit={unit} />}
            cursor={{ stroke: "rgba(255,255,255,0.14)", strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.25}
            fill={`url(#${id}-fill)`}
            dot={false}
            activeDot={{
              r: 4,
              fill: color,
              stroke: "#090a0c",
              strokeWidth: 2.5,
            }}
            animationDuration={650}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
