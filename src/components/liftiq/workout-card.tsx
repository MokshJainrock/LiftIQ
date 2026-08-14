"use client";

import Link from "next/link";
import { ArrowRight, Clock, Dumbbell, Layers, Play, Trophy } from "lucide-react";
import { TODAY_WORKOUT, fmtNum } from "@/lib/liftiq/demo-data";
import { href } from "./nav-config";
import { Button, Pill, Ring } from "./primitives";

/** The dashboard's primary object: what am I training today, and am I ready? */
export function HeroWorkoutCard() {
  const w = TODAY_WORKOUT;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#15171c]">
      {/* Restrained accent wash — one gradient, top-right only */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-[340px] w-[340px] rounded-full opacity-[0.55]"
        style={{ background: "radial-gradient(circle, rgba(182,242,58,0.13), transparent 62%)" }}
      />

      <div className="relative grid gap-8 p-6 md:p-7 lg:grid-cols-[1.35fr_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="liq-eyebrow">Today&apos;s Workout</p>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <p className="text-[11.5px] font-medium liq-t2">
              {w.split} • {w.focus}
            </p>
          </div>

          <h2 className="liq-tight mt-2.5 text-[28px] font-semibold leading-tight liq-t1 md:text-[34px]">
            {w.title}
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="flex items-center gap-2 text-[13px] liq-t2">
              <Dumbbell size={14} className="text-[#6b7280]" />
              <span className="liq-num font-semibold liq-t1">{w.exerciseCount}</span> exercises
            </span>
            <span className="flex items-center gap-2 text-[13px] liq-t2">
              <Layers size={14} className="text-[#6b7280]" />
              <span className="liq-num font-semibold liq-t1">{w.workingSets}</span> working sets
            </span>
            <span className="flex items-center gap-2 text-[13px] liq-t2">
              <Clock size={14} className="text-[#6b7280]" />
              <span className="liq-num font-semibold liq-t1">{w.estimatedMinutes}</span> min
            </span>
          </div>

          <ol className="mt-6 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {w.exercises.map((ex, i) => (
              <li
                key={ex.name}
                className="flex items-center gap-3 border-b border-white/[0.05] py-2 last:border-0 sm:last:border-b"
              >
                <span className="liq-num w-4 text-[11px] font-semibold liq-t3">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] liq-t1">{ex.name}</span>
                <span className="liq-num text-[11.5px] liq-t3">{ex.scheme}</span>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={href("/train")}>
              <Button variant="accent" size="lg" className="liq-glow">
                <Play size={16} />
                Start Workout
              </Button>
            </Link>
            <Link href={href("/programs")}>
              <Button variant="ghost" size="lg">
                View Workout
              </Button>
            </Link>
          </div>
        </div>

        {/* Readiness */}
        <div className="flex flex-col items-center justify-center gap-4 border-t border-white/[0.07] pt-6 lg:w-[210px] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <Ring value={w.readiness} size={128} stroke={9}>
            <span className="liq-num text-[30px] font-semibold leading-none liq-t1">
              {w.readiness}
              <span className="text-[15px] font-medium liq-t3">%</span>
            </span>
            <span className="liq-eyebrow mt-1.5">Readiness</span>
          </Ring>
          <Pill tone="accent">Optimal</Pill>
          <p className="max-w-[190px] text-center text-[12.5px] leading-relaxed liq-t2">
            {w.readinessNote}
          </p>
        </div>
      </div>
    </section>
  );
}

/** History row. Reveals the drill-in affordance on hover. */
export function WorkoutRow({
  name,
  day,
  sets,
  volume,
  duration,
  highlight,
}: {
  name: string;
  day: string;
  sets: number;
  volume: number;
  duration: string;
  highlight?: string | null;
}) {
  return (
    <Link
      href={href("/train")}
      className="group flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors duration-150 hover:bg-white/[0.035]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13.5px] font-medium liq-t1">{name}</p>
          {highlight && (
            <Pill tone="accent">
              <Trophy size={10} />
              {highlight}
            </Pill>
          )}
        </div>
        <p className="mt-0.5 text-[11.5px] liq-t3">{day}</p>
      </div>

      <div className="hidden items-center gap-7 sm:flex">
        <span className="text-right">
          <span className="liq-num block text-[13px] font-semibold liq-t1">{sets}</span>
          <span className="block text-[10.5px] liq-t3">sets</span>
        </span>
        <span className="text-right">
          <span className="liq-num block text-[13px] font-semibold liq-t1">{fmtNum(volume)}</span>
          <span className="block text-[10.5px] liq-t3">lb volume</span>
        </span>
        <span className="text-right">
          <span className="liq-num block text-[13px] font-semibold liq-t1">{duration}</span>
          <span className="block text-[10.5px] liq-t3">duration</span>
        </span>
      </div>

      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#b6f23a] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <span className="hidden md:inline">View workout</span>
        <ArrowRight size={14} />
      </span>
    </Link>
  );
}
