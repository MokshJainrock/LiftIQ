"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { PROGRAM_BUILDER_DAYS } from "@/lib/liftiq/demo-data";
import { href } from "@/components/liftiq/nav-config";
import { Button, Card, PageHeader, Pill, Reveal } from "@/components/liftiq/primitives";

type BuilderExercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rpe: string;
  rest: string;
  progression: string;
};

type BuilderDay = { id: string; label: string; name: string; exercises: BuilderExercise[] };

const PROGRESSION_RULES = [
  "Linear +5 lb",
  "Linear +10 lb",
  "Double progression",
  "RPE target",
  "% of 1RM",
];

const INITIAL: BuilderDay[] = PROGRAM_BUILDER_DAYS.map((d) => ({
  ...d,
  exercises: d.exercises.map((e) => ({ ...e, progression: "Linear +5 lb" })),
}));

function Field({
  value,
  onChange,
  width = "w-16",
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  width?: string;
  ariaLabel: string;
}) {
  return (
    <input
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={`liq-num h-9 ${width} rounded-lg border border-white/[0.07] bg-white/[0.03] text-center text-[13px] font-semibold liq-t1 transition-colors duration-150 hover:border-white/[0.14] focus:border-[#b6f23a]/45 focus:outline-none`}
    />
  );
}

export default function ProgramBuilderPage() {
  const [name, setName] = useState("Strength Builder");
  const [days, setDays] = useState<BuilderDay[]>(INITIAL);
  const [drag, setDrag] = useState<{ dayId: string; index: number } | null>(null);
  const [overIndex, setOverIndex] = useState<{ dayId: string; index: number } | null>(null);

  const patchExercise = useCallback(
    (dayId: string, exId: string, patch: Partial<BuilderExercise>) => {
      setDays((prev) =>
        prev.map((d) =>
          d.id === dayId
            ? { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) }
            : d
        )
      );
    },
    []
  );

  const removeExercise = useCallback((dayId: string, exId: string) => {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d))
    );
  }, []);

  const addExercise = useCallback((dayId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              exercises: [
                ...d.exercises,
                {
                  id: `ex-${Date.now()}`,
                  name: "New Exercise",
                  sets: 3,
                  reps: "8",
                  rpe: "8",
                  rest: "2:00",
                  progression: "Linear +5 lb",
                },
              ],
            }
          : d
      )
    );
  }, []);

  const addDay = useCallback(() => {
    setDays((prev) => [
      ...prev,
      {
        id: `day-${Date.now()}`,
        label: `Day ${prev.length + 1}`,
        name: "New Training Day",
        exercises: [],
      },
    ]);
  }, []);

  /** Reorder within a day using native drag events — no extra dependency. */
  const onDrop = useCallback(
    (dayId: string, targetIndex: number) => {
      setOverIndex(null);
      if (!drag || drag.dayId !== dayId || drag.index === targetIndex) return setDrag(null);

      setDays((prev) =>
        prev.map((d) => {
          if (d.id !== dayId) return d;
          const next = [...d.exercises];
          const [moved] = next.splice(drag.index, 1);
          next.splice(targetIndex, 0, moved);
          return { ...d, exercises: next };
        })
      );
      setDrag(null);
    },
    [drag]
  );

  const totalSets = days.reduce((n, d) => n + d.exercises.reduce((m, e) => m + e.sets, 0), 0);

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <Link
            href={href("/programs")}
            className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] liq-t3 transition-colors duration-150 hover:text-[#f7f7f8]"
          >
            <ArrowLeft size={14} />
            Back to Programs
          </Link>

          <PageHeader
            title="Program Builder"
            subtitle="Define training days, prescriptions and progression rules."
            actions={
              <>
                <Button variant="ghost">Preview</Button>
                <Button variant="accent">
                  <Save size={15} />
                  Save Program
                </Button>
              </>
            }
          />
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <Card className="p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-[1.6fr_repeat(3,minmax(0,0.6fr))]">
            <div>
              <label className="liq-eyebrow mb-2 block">Program Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-white/[0.07] bg-white/[0.03] px-3 text-[14px] font-medium liq-t1 transition-colors duration-150 hover:border-white/[0.14] focus:border-[#b6f23a]/45 focus:outline-none"
              />
            </div>
            <div>
              <p className="liq-eyebrow mb-2">Training Days</p>
              <p className="liq-num text-[22px] font-semibold liq-t1">{days.length}</p>
            </div>
            <div>
              <p className="liq-eyebrow mb-2">Weekly Sets</p>
              <p className="liq-num text-[22px] font-semibold liq-t1">{totalSets}</p>
            </div>
            <div>
              <p className="liq-eyebrow mb-2">Block Length</p>
              <p className="liq-num text-[22px] font-semibold liq-t1">
                12<span className="ml-1 text-[13px] font-medium liq-t3">weeks</span>
              </p>
            </div>
          </div>
        </Card>
      </Reveal>

      {days.map((day, di) => (
        <Reveal key={day.id} delay={0.08 + di * 0.04}>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-5">
              <div className="flex items-center gap-3">
                <Pill tone="accent">{day.label}</Pill>
                <input
                  value={day.name}
                  aria-label={`${day.label} name`}
                  onChange={(e) =>
                    setDays((prev) =>
                      prev.map((d) => (d.id === day.id ? { ...d, name: e.target.value } : d))
                    )
                  }
                  className="liq-tight border-b border-transparent bg-transparent text-[16px] font-semibold liq-t1 transition-colors duration-150 hover:border-white/15 focus:border-[#b6f23a]/45 focus:outline-none"
                />
              </div>
              <span className="liq-num text-[12px] liq-t3">
                {day.exercises.length} exercises ·{" "}
                {day.exercises.reduce((n, e) => n + e.sets, 0)} sets
              </span>
            </div>

            {/* Column headers */}
            <div className="hidden items-center gap-3 px-5 pt-4 text-[10.5px] font-semibold uppercase tracking-[0.1em] liq-t3 lg:flex">
              <span className="w-5" />
              <span className="flex-1">Exercise</span>
              <span className="w-16 text-center">Sets</span>
              <span className="w-16 text-center">Reps</span>
              <span className="w-16 text-center">RPE</span>
              <span className="w-16 text-center">Rest</span>
              <span className="w-[150px]">Progression</span>
              <span className="w-8" />
            </div>

            <ul className="space-y-2 p-4 lg:px-5">
              {day.exercises.map((ex, i) => (
                <li
                  key={ex.id}
                  draggable
                  onDragStart={() => setDrag({ dayId: day.id, index: i })}
                  onDragEnd={() => {
                    setDrag(null);
                    setOverIndex(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverIndex({ dayId: day.id, index: i });
                  }}
                  onDrop={() => onDrop(day.id, i)}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border bg-white/[0.02] p-3 transition-colors duration-150 lg:flex-nowrap ${
                    overIndex?.dayId === day.id && overIndex.index === i
                      ? "border-[#b6f23a]/40"
                      : "border-white/[0.06] hover:border-white/[0.12]"
                  } ${drag?.dayId === day.id && drag.index === i ? "opacity-40" : ""}`}
                >
                  <span className="w-5 cursor-grab text-[#4b5058] transition-colors duration-150 hover:text-[#9ca3af] active:cursor-grabbing">
                    <GripVertical size={16} />
                  </span>

                  <input
                    value={ex.name}
                    aria-label="Exercise name"
                    onChange={(e) => patchExercise(day.id, ex.id, { name: e.target.value })}
                    className="min-w-[150px] flex-1 border-b border-transparent bg-transparent text-[13.5px] font-medium liq-t1 transition-colors duration-150 hover:border-white/15 focus:border-[#b6f23a]/45 focus:outline-none"
                  />

                  <Field
                    ariaLabel="Sets"
                    value={String(ex.sets)}
                    onChange={(v) => patchExercise(day.id, ex.id, { sets: Number(v) || 0 })}
                  />
                  <Field
                    ariaLabel="Reps"
                    value={ex.reps}
                    onChange={(v) => patchExercise(day.id, ex.id, { reps: v })}
                  />
                  <Field
                    ariaLabel="RPE"
                    value={ex.rpe}
                    onChange={(v) => patchExercise(day.id, ex.id, { rpe: v })}
                  />
                  <Field
                    ariaLabel="Rest"
                    value={ex.rest}
                    onChange={(v) => patchExercise(day.id, ex.id, { rest: v })}
                  />

                  <select
                    value={ex.progression}
                    aria-label="Progression rule"
                    onChange={(e) => patchExercise(day.id, ex.id, { progression: e.target.value })}
                    className="h-9 w-[150px] rounded-lg border border-white/[0.07] bg-[#191c22] px-2.5 text-[12.5px] liq-t1 transition-colors duration-150 hover:border-white/[0.14] focus:border-[#b6f23a]/45 focus:outline-none"
                  >
                    {PROGRESSION_RULES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => removeExercise(day.id, ex.id)}
                    aria-label={`Remove ${ex.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors duration-150 hover:bg-[#e0655f]/12 hover:text-[#e0655f]"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="px-4 pb-4 lg:px-5">
              <button
                onClick={() => addExercise(day.id)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-white/[0.11] text-[12.5px] font-medium liq-t2 transition-colors duration-150 hover:border-white/25 hover:bg-white/[0.03]"
              >
                <Plus size={14} />
                Add Exercise
              </button>
            </div>
          </Card>
        </Reveal>
      ))}

      <Reveal delay={0.2}>
        <button
          onClick={addDay}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.12] text-[13.5px] font-medium liq-t2 transition-colors duration-150 hover:border-[#b6f23a]/35 hover:bg-[#b6f23a]/[0.03] hover:text-[#f7f7f8]"
        >
          <Plus size={16} />
          Add Training Day
        </button>
      </Reveal>
    </div>
  );
}
