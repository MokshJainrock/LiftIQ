"use client";

import { Activity, Gauge, HeartPulse, Moon } from "lucide-react";
import { RECOVERY, USER } from "@/lib/liftiq/demo-data";
import { AIInsight } from "@/components/liftiq/ai-insight";
import { MetricCard } from "@/components/liftiq/metric-card";
import { ProgressChart } from "@/components/liftiq/progress-chart";
import { RecoveryScore } from "@/components/liftiq/recovery-score";
import { Bar, Card, CardHeader, PageHeader, Reveal } from "@/components/liftiq/primitives";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const FACTORS = [
  { label: "Sleep duration", value: 82, note: "7h 42m average" },
  { label: "Sleep consistency", value: 74, note: "±38 min bedtime" },
  { label: "Resting heart rate", value: 88, note: "52 bpm" },
  { label: "HRV balance", value: 69, note: "64 ms, 7-day mean" },
  { label: "Training load", value: 61, note: "Moderate" },
];

export default function RecoveryPage() {
  const trend = RECOVERY.trend.map((value, i) => ({ label: DAYS[i], value }));

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader
          title="Recovery"
          subtitle="Whether your body is ready for the load you have planned."
        />
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal delay={0.04}>
          <Card className="p-5 md:p-6">
            <CardHeader title="Today" subtitle="Composite readiness score" />
            <div className="mt-5">
              <RecoveryScore />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-2">
          <Card className="flex h-full flex-col p-5 md:p-6">
            <CardHeader title="7-Day Recovery Trend" subtitle="Higher is better" />
            <div className="mt-5 flex-1">
              <ProgressChart data={trend} height={240} unit="%" id="recovery-trend" />
            </div>
          </Card>
        </Reveal>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Reveal delay={0.12}>
          <MetricCard label="Sleep" value="7h 42m" footnote="last night" icon={<Moon size={15} />} />
        </Reveal>
        <Reveal delay={0.15}>
          <MetricCard
            label="Resting HR"
            value="52"
            unit="bpm"
            footnote="−2 vs baseline"
            icon={<HeartPulse size={15} />}
          />
        </Reveal>
        <Reveal delay={0.18}>
          <MetricCard label="HRV" value="64" unit="ms" footnote="7-day mean" icon={<Activity size={15} />} />
        </Reveal>
        <Reveal delay={0.21}>
          <MetricCard
            label="Training Load"
            value="Moderate"
            footnote="week 6 of block"
            icon={<Gauge size={15} />}
          />
        </Reveal>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal delay={0.24} className="lg:col-span-2">
          <Card className="p-5 md:p-6">
            <CardHeader title="Contributing Factors" subtitle="What drives today's score" />
            <ul className="mt-5 space-y-4">
              {FACTORS.map((f, i) => (
                <li key={f.label}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-medium liq-t1">{f.label}</span>
                    <span className="flex items-baseline gap-2.5">
                      <span className="text-[11.5px] liq-t3">{f.note}</span>
                      <span className="liq-num text-[13px] font-semibold liq-t1">{f.value}</span>
                    </span>
                  </div>
                  <Bar
                    value={f.value}
                    color={f.value >= 75 ? "#b6f23a" : f.value >= 60 ? "#f5b544" : "#e0655f"}
                    delay={i * 0.04}
                  />
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal delay={0.28}>
          <div className="space-y-4">
            <AIInsight
              tone="good"
              title="Cleared for heavy training today"
              body={`At ${RECOVERY.score}% recovery with low muscle fatigue, your planned push session at prescribed loads is appropriate. No rest day needed.`}
            />
            <AIInsight
              tone="warn"
              title="Bedtime variance is your weakest input"
              body="Sleep duration is strong but your bedtime moves by ±38 minutes. Tightening that window is the single fastest way to lift this score above 85%."
            />
            <Card className="p-5">
              <CardHeader title="Rest Recommendation" />
              <p className="liq-num mt-3 text-[32px] font-semibold leading-none liq-t1">
                0<span className="ml-1.5 text-[15px] font-medium liq-t3">days</span>
              </p>
              <p className="mt-2.5 text-[12.5px] liq-t2">
                Next scheduled deload: week 8. Your {USER.streak}-day streak is sustainable at current
                load.
              </p>
            </Card>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
