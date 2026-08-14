"use client";

import { useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import {
  BODY,
  LIFTS,
  LIFT_ORDER,
  MUSCLE_BALANCE,
  MUSCLE_VOLUME,
  STRENGTH_SCORE,
  USER,
  VOLUME_TREND,
  WEEKLY_VOLUME,
  fmtNum,
  type LiftKey,
} from "@/lib/liftiq/demo-data";
import { AIInsight } from "@/components/liftiq/ai-insight";
import { TrainingHeatmap } from "@/components/liftiq/heatmap";
import { MetricCard } from "@/components/liftiq/metric-card";
import { MuscleVolume } from "@/components/liftiq/muscle-volume";
import { ProgressChart } from "@/components/liftiq/progress-chart";
import { StrengthProgressCard } from "@/components/liftiq/strength-progress-card";
import { StrengthStandards } from "@/components/liftiq/strength-standards";
import {
  Bar,
  Button,
  Card,
  CardHeader,
  Delta,
  PageHeader,
  Reveal,
  Ring,
  Segmented,
  Sparkline,
} from "@/components/liftiq/primitives";

const TABS = ["Overview", "Strength", "Volume", "Muscles", "Body"] as const;
type Tab = (typeof TABS)[number];

function LiftCard({ liftKey }: { liftKey: LiftKey }) {
  const lift = LIFTS[liftKey];
  const changePct = Math.round(((lift.current - lift.previous) / lift.previous) * 1000) / 10;

  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="liq-eyebrow">{lift.name}</p>
          <p className="liq-num mt-2 flex items-baseline gap-1 text-[26px] font-semibold leading-none liq-t1">
            {lift.current}
            <span className="text-[13px] font-medium liq-t3">lb</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Delta value={changePct} />
            <span className="liq-num text-[11.5px] liq-t3">from {lift.previous} lb</span>
          </div>
        </div>
        <Sparkline data={lift.history.map((h) => h.value)} width={78} height={38} />
      </div>
    </Card>
  );
}

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader
          title="Progress"
          subtitle="Long-term performance trends across strength, volume and recovery."
          actions={
            <Button variant="ghost" size="sm">
              <Download size={14} />
              Export
            </Button>
          }
        />
      </Reveal>

      <Reveal delay={0.04}>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <Segmented options={TABS} value={tab} onChange={setTab} />
        </div>
      </Reveal>

      {tab === "Overview" && (
        <div className="space-y-4">
          <Reveal delay={0.08}>
            <Card className="p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <Ring value={STRENGTH_SCORE.value} max={STRENGTH_SCORE.max} size={112} stroke={8}>
                    <span className="liq-num text-[26px] font-semibold leading-none liq-t1">
                      {STRENGTH_SCORE.value}
                    </span>
                    <span className="liq-eyebrow mt-1">Score</span>
                  </Ring>
                  <div>
                    <p className="liq-eyebrow">Strength Score</p>
                    <p className="liq-num mt-1.5 text-[38px] font-semibold leading-none liq-t1">
                      {STRENGTH_SCORE.value}
                    </p>
                    <div className="mt-2">
                      <Delta value={STRENGTH_SCORE.yearDeltaPct} suffix="over 12 months" />
                    </div>
                    <p className="mt-3 max-w-md text-[13px] liq-t2">
                      A single number derived from your four main lifts, normalised to bodyweight and
                      training age. You are in the top band of the {USER.level.toLowerCase()} range.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {LIFT_ORDER.map((key) => (
                    <div key={key}>
                      <p className="text-[11.5px] liq-t3">{LIFTS[key].name}</p>
                      <p className="liq-num text-[15px] font-semibold liq-t1">
                        {LIFTS[key].current} lb
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {LIFT_ORDER.map((key, i) => (
              <Reveal key={key} delay={0.12 + i * 0.03}>
                <LiftCard liftKey={key} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.24}>
            <Card className="p-5 md:p-6">
              <CardHeader
                title="Training Consistency"
                subtitle="Last 12 months — darker cells are higher volume days"
              />
              <div className="mt-5">
                <TrainingHeatmap />
              </div>
            </Card>
          </Reveal>
        </div>
      )}

      {tab === "Strength" && (
        <div className="space-y-4">
          <Reveal delay={0.08}>
            <StrengthProgressCard height={300} />
          </Reveal>

          <Reveal delay={0.12}>
            <Card className="p-5 md:p-6">
              <CardHeader
                title="Strength Standards"
                subtitle={`Relative to a ${USER.bodyweight} lb lifter`}
              />
              <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-x-12">
                {LIFT_ORDER.map((key) => (
                  <StrengthStandards key={key} liftKey={key} />
                ))}
              </div>
            </Card>
          </Reveal>
        </div>
      )}

      {tab === "Volume" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Reveal delay={0.08}>
              <MetricCard
                label="This Week"
                value={fmtNum(WEEKLY_VOLUME.total)}
                unit="lb"
                delta={<Delta value={WEEKLY_VOLUME.deltaPct} suffix="vs last week" />}
                icon={<TrendingUp size={15} />}
              />
            </Reveal>
            <Reveal delay={0.11}>
              <MetricCard
                label="8-Week Average"
                value={fmtNum(
                  Math.round(WEEKLY_VOLUME.series.reduce((a, b) => a + b, 0) / WEEKLY_VOLUME.series.length)
                )}
                unit="lb"
                footnote="per week"
              />
            </Reveal>
            <Reveal delay={0.14}>
              <MetricCard
                label="Working Sets"
                value={String(MUSCLE_VOLUME.reduce((n, m) => n + m.sets, 0))}
                unit="sets"
                footnote="this week"
              />
            </Reveal>
          </div>

          <Reveal delay={0.17}>
            <Card className="p-5 md:p-6">
              <CardHeader title="Weekly Volume Trend" subtitle="Total tonnage across the last 8 weeks" />
              <div className="mt-5">
                <ProgressChart data={VOLUME_TREND} height={260} id="volume-trend" unit="lb" />
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.2}>
            <Card className="p-5 md:p-6">
              <CardHeader title="Weekly Muscle Volume" subtitle="Working sets against target range" />
              <div className="mt-5">
                <MuscleVolume rows={MUSCLE_VOLUME} />
              </div>
            </Card>
          </Reveal>
        </div>
      )}

      {tab === "Muscles" && (
        <div className="space-y-4">
          <Reveal delay={0.08}>
            <Card className="p-5 md:p-6">
              <CardHeader
                title="Muscle Balance"
                subtitle="Share of total working sets over the last 4 weeks"
              />
              <div className="mt-6 space-y-4">
                {MUSCLE_BALANCE.map((m, i) => {
                  const gap = m.share - m.target;
                  const off = Math.abs(gap) >= 3;
                  return (
                    <div key={m.muscle}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="text-[13px] font-medium liq-t1">{m.muscle}</span>
                        <span className="flex items-baseline gap-2.5">
                          <span className="liq-num text-[13px] font-semibold liq-t1">{m.share}%</span>
                          <span className="liq-num text-[11px] liq-t3">target {m.target}%</span>
                          {off && (
                            <span
                              className="liq-num text-[11px] font-medium"
                              style={{ color: gap > 0 ? "#e0655f" : "#f5b544" }}
                            >
                              {gap > 0 ? "+" : ""}
                              {gap}%
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="relative">
                        <Bar
                          value={m.share}
                          max={25}
                          color={off ? (gap > 0 ? "#e0655f" : "#f5b544") : "#b6f23a"}
                          delay={i * 0.04}
                        />
                        <span
                          className="absolute top-1/2 h-2.5 w-[1.5px] -translate-y-1/2 rounded-full bg-white/25"
                          style={{ left: `${(m.target / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="grid gap-4 lg:grid-cols-2">
              <AIInsight
                tone="warn"
                title="Your hamstring volume is 22% below your target range"
                body="Nine percent of your sets target hamstrings against a 12% target. Adding two Romanian deadlift sets per week closes the gap without extending session length."
              />
              <AIInsight
                tone="good"
                title="Push and pull volume are well balanced"
                body="Back sits at 22% against chest and shoulders at 31% combined — a healthy ratio that protects the shoulder joint at your current bench progression."
              />
            </div>
          </Reveal>
        </div>
      )}

      {tab === "Body" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Reveal delay={0.08}>
              <MetricCard
                label="Bodyweight"
                value={String(BODY.weight)}
                unit="lb"
                delta={<Delta value={BODY.weightDeltaPct} suffix="over 6 months" />}
                visual={<Sparkline data={BODY.weightSeries.map((w) => w.value)} width={84} height={34} />}
              />
            </Reveal>
            <Reveal delay={0.11}>
              <MetricCard
                label="Body Fat"
                value={String(BODY.bodyFat)}
                unit="%"
                delta={<Delta value={BODY.bodyFatDelta} suffix="over 6 months" />}
              />
            </Reveal>
            <Reveal delay={0.14}>
              <MetricCard label="Lean Mass" value={String(BODY.leanMass)} unit="lb" footnote="estimated" />
            </Reveal>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Reveal delay={0.17} className="lg:col-span-2">
              <Card className="p-5 md:p-6">
                <CardHeader title="Bodyweight Trend" subtitle="Lean gaining phase — 0.7 lb per month" />
                <div className="mt-5">
                  <ProgressChart data={BODY.weightSeries} height={260} id="bodyweight" unit="lb" />
                </div>
              </Card>
            </Reveal>

            <Reveal delay={0.2}>
              <Card className="p-5 md:p-6">
                <CardHeader title="Measurements" subtitle="Change over 12 weeks" />
                <div className="mt-4 divide-y divide-white/[0.05]">
                  {BODY.measurements.map((m) => (
                    <div key={m.site} className="flex items-center justify-between py-3">
                      <span className="text-[13px] liq-t2">{m.site}</span>
                      <span className="flex items-baseline gap-3">
                        <span className="liq-num text-[13.5px] font-semibold liq-t1">{m.value}&quot;</span>
                        <Delta value={m.delta} unit="&quot;" />
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      )}
    </div>
  );
}
