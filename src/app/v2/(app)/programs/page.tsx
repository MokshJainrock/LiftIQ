"use client";

import Link from "next/link";
import { ArrowRight, CalendarRange, Layers, Play, Plus, Repeat } from "lucide-react";
import { ACTIVE_PROGRAM, PROGRAM_BUILDER_DAYS, PROGRAM_LIBRARY } from "@/lib/liftiq/demo-data";
import { href } from "@/components/liftiq/nav-config";
import { Bar, Button, Card, CardHeader, PageHeader, Pill, Reveal, Ring } from "@/components/liftiq/primitives";

const WEEK_PLAN = [
  { day: "Mon", name: "Upper Strength", sets: 18, done: true },
  { day: "Tue", name: "Lower Strength", sets: 16, done: true },
  { day: "Thu", name: "Upper Hypertrophy", sets: 20, done: false },
  { day: "Sat", name: "Lower Hypertrophy", sets: 18, done: false },
];

export default function ProgramsPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader
          title="Training Programs"
          subtitle="Structured blocks that drive your weekly prescription."
          actions={
            <Link href={href("/programs/builder")}>
              <Button variant="accent">
                <Plus size={15} />
                Create Program
              </Button>
            </Link>
          }
        />
      </Reveal>

      {/* Active program */}
      <Reveal delay={0.04}>
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#15171c]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-28 h-[300px] w-[300px] rounded-full opacity-50"
            style={{ background: "radial-gradient(circle, rgba(182,242,58,0.12), transparent 62%)" }}
          />

          <div className="relative grid gap-8 p-6 md:p-7 lg:grid-cols-[1.4fr_auto]">
            <div>
              <div className="flex items-center gap-2.5">
                <Pill tone="accent">Active Program</Pill>
                <span className="text-[11.5px] liq-t3">
                  Week {ACTIVE_PROGRAM.week} of {ACTIVE_PROGRAM.totalWeeks}
                </span>
              </div>

              <h2 className="liq-tight mt-3 text-[28px] font-semibold liq-t1 md:text-[32px]">
                {ACTIVE_PROGRAM.name}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] liq-t2">
                <span className="flex items-center gap-2">
                  <CalendarRange size={14} className="text-[#6b7280]" />
                  <span className="liq-num font-semibold liq-t1">{ACTIVE_PROGRAM.daysPerWeek}</span>
                  days/week
                </span>
                <span className="flex items-center gap-2">
                  <Repeat size={14} className="text-[#6b7280]" />
                  {ACTIVE_PROGRAM.structure}
                </span>
                <span className="flex items-center gap-2">
                  <Layers size={14} className="text-[#6b7280]" />
                  72 sessions total
                </span>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="liq-eyebrow">Block Progress</span>
                  <span className="liq-num text-[13px] font-semibold liq-t1">
                    {ACTIVE_PROGRAM.progress}%
                  </span>
                </div>
                <Bar value={ACTIVE_PROGRAM.progress} height={8} />
              </div>

              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {WEEK_PLAN.map((d) => (
                  <li
                    key={d.day}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                  >
                    <span
                      className={`liq-num flex h-7 w-9 items-center justify-center rounded-lg text-[11px] font-semibold ${
                        d.done ? "bg-[#b6f23a]/12 text-[#b6f23a]" : "bg-white/[0.05] liq-t3"
                      }`}
                    >
                      {d.day}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] liq-t1">{d.name}</span>
                    <span className="liq-num text-[11.5px] liq-t3">{d.sets} sets</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={href("/train")}>
                  <Button variant="accent" size="lg" className="liq-glow">
                    <Play size={16} />
                    Continue Program
                  </Button>
                </Link>
                <Link href={href("/programs/builder")}>
                  <Button variant="ghost" size="lg">
                    Edit Program
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 border-t border-white/[0.07] pt-6 lg:w-[200px] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <Ring value={ACTIVE_PROGRAM.week} max={ACTIVE_PROGRAM.totalWeeks} size={124} stroke={9}>
                <span className="liq-num text-[28px] font-semibold leading-none liq-t1">
                  {ACTIVE_PROGRAM.week}
                  <span className="text-[15px] font-medium liq-t3">/{ACTIVE_PROGRAM.totalWeeks}</span>
                </span>
                <span className="liq-eyebrow mt-1.5">Weeks</span>
              </Ring>
              <p className="text-center text-[12.5px] liq-t2">
                Deload scheduled for week {ACTIVE_PROGRAM.week + 2}.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Library */}
      <Reveal delay={0.08}>
        <div>
          <CardHeader
            title="Program Library"
            subtitle="Templates matched to your training level"
            className="mb-4"
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PROGRAM_LIBRARY.map((p, i) => (
              <Reveal key={p.name} delay={0.1 + i * 0.03}>
                <Card hover className="group flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="liq-tight text-[15px] font-semibold liq-t1">{p.name}</h3>
                      <p className="mt-1 text-[12.5px] liq-t3">{p.structure}</p>
                    </div>
                    <Pill>{p.level}</Pill>
                  </div>

                  <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
                    <div>
                      <dt className="text-[10.5px] liq-t3">Days</dt>
                      <dd className="liq-num text-[14px] font-semibold liq-t1">{p.days}</dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] liq-t3">Weeks</dt>
                      <dd className="liq-num text-[14px] font-semibold liq-t1">{p.weeks}</dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] liq-t3">Focus</dt>
                      <dd className="text-[12px] font-medium liq-t1">{p.focus}</dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-[12px] liq-t3">{PROGRAM_BUILDER_DAYS.length * p.days} sessions</span>
                    <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#b6f23a] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      Start program
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </Card>
              </Reveal>
            ))}

            <Reveal delay={0.25}>
              <Link href={href("/programs/builder")} className="block h-full">
                <div className="flex h-full min-h-[188px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] p-5 text-center transition-colors duration-150 hover:border-[#b6f23a]/35 hover:bg-[#b6f23a]/[0.03]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] liq-t2">
                    <Plus size={19} />
                  </span>
                  <p className="mt-3 text-[13.5px] font-medium liq-t1">Create Program</p>
                  <p className="mt-1 max-w-[210px] text-[12px] liq-t3">
                    Build a block from scratch with your own progression rules.
                  </p>
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
