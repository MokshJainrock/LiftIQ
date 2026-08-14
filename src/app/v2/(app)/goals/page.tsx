"use client";

import { CheckCircle2, Flag, Plus, Target } from "lucide-react";
import { GOALS, USER } from "@/lib/liftiq/demo-data";
import { AIInsight } from "@/components/liftiq/ai-insight";
import { Bar, Button, Card, CardHeader, PageHeader, Pill, Reveal, Ring } from "@/components/liftiq/primitives";

export default function GoalsPage() {
  const completed = GOALS.filter((g) => g.current >= g.target).length;
  const avgProgress = Math.round(
    GOALS.reduce((n, g) => n + Math.min(100, (g.current / g.target) * 100), 0) / GOALS.length
  );

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader
          title="Goals"
          subtitle="Targets that shape your program and progression rules."
          actions={
            <Button variant="accent">
              <Plus size={15} />
              New Goal
            </Button>
          }
        />
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal delay={0.04}>
          <Card className="flex items-center gap-5 p-5 md:p-6">
            <Ring value={avgProgress} size={104} stroke={8}>
              <span className="liq-num text-[24px] font-semibold leading-none liq-t1">
                {avgProgress}
                <span className="text-[13px] font-medium liq-t3">%</span>
              </span>
            </Ring>
            <div>
              <p className="liq-eyebrow">Average Progress</p>
              <p className="mt-1.5 text-[13px] liq-t2">
                {completed} of {GOALS.length} goals met
              </p>
              <div className="mt-3">
                <Pill tone="accent">{USER.goal}</Pill>
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-2">
          <AIInsight
            tone="good"
            title="Your bench goal is 4 weeks ahead of schedule"
            body="At 2.1 lb per week you reach 275 lb in mid-October rather than November. Your deadlift target is the one at risk — it needs 40 lb in five months against a current rate of 10 lb per month."
            className="h-full"
          />
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <Card className="p-5 md:p-6">
          <CardHeader title="Active Goals" subtitle="Progress toward each target" />

          <ul className="mt-5 space-y-5">
            {GOALS.map((g, i) => {
              const pct = Math.min(100, Math.round((g.current / g.target) * 100));
              const met = g.current >= g.target;
              const remaining = Math.max(0, g.target - g.current);

              return (
                <li key={g.name} className="border-b border-white/[0.05] pb-5 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                          met ? "bg-[#b6f23a]/12 text-[#b6f23a]" : "bg-white/[0.05] liq-t2"
                        }`}
                      >
                        {met ? <CheckCircle2 size={16} /> : <Target size={16} />}
                      </span>
                      <div>
                        <p className="text-[14px] font-medium liq-t1">{g.name}</p>
                        <p className="mt-0.5 text-[12px] liq-t3">
                          {met ? "Target met" : `${remaining} ${g.unit} to go`} · ETA {g.eta}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="liq-num text-[16px] font-semibold liq-t1">
                        {g.current}
                        <span className="text-[12px] font-medium liq-t3"> / {g.target} {g.unit}</span>
                      </p>
                      <p className="liq-num text-[11.5px] font-medium text-[#b6f23a]">{pct}%</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Bar value={pct} color={met ? "#b6f23a" : "#f7f7f8"} delay={i * 0.04} />
                  </div>
                </li>
              );
            })}
          </ul>

          <button className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-white/[0.11] text-[13px] font-medium liq-t2 transition-colors duration-150 hover:border-white/25 hover:bg-white/[0.03]">
            <Flag size={14} />
            Add another goal
          </button>
        </Card>
      </Reveal>
    </div>
  );
}
