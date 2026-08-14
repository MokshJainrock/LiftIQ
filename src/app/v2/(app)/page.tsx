"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Brain, Flame, History, Salad, Trophy, Video, Weight } from "lucide-react";
import {
  MUSCLE_VOLUME,
  PR_SUMMARY,
  RECENT_PRS,
  RECENT_WORKOUTS,
  STRENGTH_SCORE,
  USER,
  WEEKLY_VOLUME,
  fmtNum,
} from "@/lib/liftiq/demo-data";
import { AIInsight } from "@/components/liftiq/ai-insight";
import { MetricCard } from "@/components/liftiq/metric-card";
import { MuscleVolume } from "@/components/liftiq/muscle-volume";
import { PRCard } from "@/components/liftiq/pr-card";
import { RecoveryScore } from "@/components/liftiq/recovery-score";
import { StrengthProgressCard } from "@/components/liftiq/strength-progress-card";
import { HeroWorkoutCard, WorkoutRow } from "@/components/liftiq/workout-card";
import { href } from "@/components/liftiq/nav-config";
import {
  Button,
  Card,
  CardHeader,
  Delta,
  Reveal,
  Ring,
  Sparkline,
} from "@/components/liftiq/primitives";

function greetingForNow() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          {/* Server and client clocks can disagree; the client value wins. */}
          <h1
            suppressHydrationWarning
            className="liq-tight text-[26px] font-semibold liq-t1 md:text-[30px]"
          >
            {greetingForNow()}, {USER.firstName}
          </h1>
          <p className="mt-1.5 text-[14px] liq-t2">Here&apos;s how your training is progressing.</p>
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <HeroWorkoutCard />
      </Reveal>

      <Reveal delay={0.06}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(
            [
              ["/diet", "Diet", Salad],
              ["/mind", "Mind", Brain],
              ["/library", "Library", Video],
              ["/history", "History", History],
              ["/stats", "Stats", BarChart3],
            ] as const
          ).map(([path, label, Icon]) => (
            <Link
              key={path}
              href={href(path)}
              className="flex items-center gap-2.5 rounded-[10px] border border-white/[0.07] bg-[#15171c] px-3 py-2.5 text-[13px] font-medium liq-t2 transition-colors hover:border-white/[0.13] hover:text-[#f7f7f8]"
            >
              <Icon size={15} className="text-[#b6f23a]" />
              {label}
            </Link>
          ))}
        </div>
      </Reveal>

      {/* Headline metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Reveal delay={0.08}>
          <MetricCard
            label="Weekly Volume"
            value={fmtNum(WEEKLY_VOLUME.total)}
            unit="lb"
            delta={<Delta value={WEEKLY_VOLUME.deltaPct} suffix="vs last week" />}
            icon={<Weight size={15} />}
            visual={<Sparkline data={WEEKLY_VOLUME.series} width={92} height={34} />}
          />
        </Reveal>

        <Reveal delay={0.12}>
          <MetricCard
            label="Training Streak"
            value={String(USER.streak)}
            unit="days"
            footnote={`Best: ${USER.bestStreak} days`}
            icon={<Flame size={15} className="text-[#f5b544]" />}
            visual={
              <div className="flex h-[34px] items-end gap-[3px]">
                {[4, 7, 5, 9, 8, 12, 12].map((h, i) => (
                  <span
                    key={i}
                    className="w-[5px] rounded-sm bg-[#f5b544]/70"
                    style={{ height: `${(h / 12) * 34}px` }}
                  />
                ))}
              </div>
            }
          />
        </Reveal>

        <Reveal delay={0.16}>
          <MetricCard
            label="Strength Score"
            value={String(STRENGTH_SCORE.value)}
            delta={<Delta value={STRENGTH_SCORE.monthDelta} unit="" suffix="this month" />}
            visual={
              <Ring value={STRENGTH_SCORE.value} max={STRENGTH_SCORE.max} size={54} stroke={5}>
                <span className="liq-num text-[10px] font-semibold liq-t3">
                  {Math.round((STRENGTH_SCORE.value / STRENGTH_SCORE.max) * 100)}%
                </span>
              </Ring>
            }
          />
        </Reveal>

        <Reveal delay={0.2}>
          <MetricCard
            label="Personal Records"
            value={String(PR_SUMMARY.count)}
            unit="PRs"
            footnote={PR_SUMMARY.period}
            icon={<Trophy size={15} className="text-[#b6f23a]" />}
            visual={
              <div className="flex h-[34px] items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b6f23a]/[0.1] text-[#b6f23a]">
                  <Trophy size={16} />
                </span>
              </div>
            }
          />
        </Reveal>
      </div>

      {/* Progress + recovery */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal delay={0.24} className="lg:col-span-2">
          <StrengthProgressCard />
        </Reveal>

        <Reveal delay={0.28}>
          <Card className="flex h-full flex-col p-5 md:p-6">
            <CardHeader title="Recovery" subtitle="Readiness for your next session" />
            <div className="mt-5 flex flex-1 items-start">
              <RecoveryScore />
            </div>
          </Card>
        </Reveal>
      </div>

      {/* Volume + PRs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal delay={0.32} className="lg:col-span-2">
          <Card className="p-5 md:p-6">
            <CardHeader
              title="Weekly Muscle Volume"
              subtitle="Working sets per muscle group this week"
              action={
                <Link href={href("/progress")}>
                  <Button variant="quiet" size="sm">
                    Details
                    <ArrowRight size={13} />
                  </Button>
                </Link>
              }
            />
            <div className="mt-5">
              <MuscleVolume rows={MUSCLE_VOLUME} />
            </div>
            <div className="mt-5">
              <AIInsight
                tone="warn"
                title="Quads and hamstrings are under your target range"
                body="Add one squat-pattern and one hinge accessory to Thursday's lower session to close a 4-set weekly gap."
              />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.36}>
          <Card className="p-5 md:p-6">
            <CardHeader title="Recent PRs" subtitle={`${PR_SUMMARY.count} this month`} />
            <div className="mt-5 space-y-2.5">
              {RECENT_PRS.map((pr, i) => (
                <PRCard key={pr.lift} {...pr} featured={i === 0} />
              ))}
            </div>
          </Card>
        </Reveal>
      </div>

      {/* History */}
      <Reveal delay={0.4}>
        <Card className="p-5 md:p-6">
          <CardHeader
            title="Recent Workouts"
            subtitle="Your last four sessions"
            action={
              <Link href={href("/progress")}>
                <Button variant="quiet" size="sm">
                  View all
                  <ArrowRight size={13} />
                </Button>
              </Link>
            }
          />
          <div className="mt-4 divide-y divide-white/[0.05]">
            {RECENT_WORKOUTS.map((w) => (
              <WorkoutRow key={w.id} {...w} />
            ))}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
