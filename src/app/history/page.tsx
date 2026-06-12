"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { ExerciseIcon } from "@/components/exercise-icon";
import { getSessions, fetchSessions } from "@/lib/storage";
import { findLibraryByKey, findLibraryExerciseByName } from "@/lib/exercises/library";
import { WeightUnit, getWeightUnit, formatWeight, formatVolume } from "@/lib/units";
import { WorkoutSession } from "@/types";
import { Calendar, Camera, ChevronDown, Dumbbell, NotebookPen, Repeat, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SourceFilter = "all" | "manual" | "camera";

function sessionMuscle(s: WorkoutSession): string {
  const lib = findLibraryByKey(s.exercise) ?? findLibraryExerciseByName(s.exerciseName ?? "");
  return lib?.muscle ?? "full-body";
}

function sessionVolume(s: WorkoutSession): number {
  if (s.sets?.length) return s.sets.reduce((n, st) => n + (st.weight ?? 0) * st.reps, 0);
  return (s.weight ?? 0) * s.reps.length;
}

function prettyName(s: WorkoutSession): string {
  return (
    s.exerciseName ||
    s.exercise
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [unit, setUnit] = useState<WeightUnit>("lbs");

  useEffect(() => {
    queueMicrotask(() => {
      setSessions(getSessions());
      setUnit(getWeightUnit());
      void fetchSessions().then(setSessions).catch(() => {});
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (source === "manual" && s.source !== "manual") return false;
      if (source === "camera" && s.source === "manual") return false;
      if (q && !prettyName(s).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sessions, query, source]);

  const days = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const s of [...filtered].sort((a, b) => b.startTime - a.startTime)) {
      const key = new Date(s.startTime).toDateString();
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const totals = useMemo(
    () => ({
      sessions: filtered.length,
      reps: filtered.reduce((n, s) => n + s.reps.length, 0),
      volume: filtered.reduce((n, s) => n + sessionVolume(s), 0),
    }),
    [filtered],
  );

  return (
    <div className="min-h-[100dvh] has-bottom-nav md:pb-0">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em]">History</h1>
          <p className="text-zinc-500 mt-2">
            {totals.sessions} sessions · {totals.reps.toLocaleString()} reps
            {totals.volume > 0 ? ` · ${formatVolume(totals.volume, unit)} lifted` : ""}
          </p>
        </motion.div>

        {/* Search + source filter */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by exercise..."
              className="w-full h-12 rounded-xl bg-secondary border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 glass-card rounded-xl p-1.5">
            {(
              [
                { id: "all", label: "All" },
                { id: "manual", label: "Logged" },
                { id: "camera", label: "Camera" },
              ] as { id: SourceFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setSource(f.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-all min-h-[40px]",
                  source === f.id ? "bg-cyan-500/10 text-cyan-300" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {days.length === 0 ? (
          <GlassCard className="p-10 text-center text-sm text-zinc-500">
            No workouts yet — start one from the Train or Exercises tab.
          </GlassCard>
        ) : (
          <div className="space-y-7">
            {days.map(([day, daySessions]) => {
              const dayVolume = daySessions.reduce((n, s) => n + sessionVolume(s), 0);
              const dayReps = daySessions.reduce((n, s) => n + s.reps.length, 0);
              return (
                <section key={day}>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                      {new Date(day).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </h2>
                    <span className="text-[10px] text-zinc-600 tabular-nums">
                      {dayReps} reps{dayVolume > 0 ? ` · ${formatVolume(dayVolume, unit)}` : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {daySessions.map((s) => {
                      const isOpen = expanded === s.id;
                      const volume = sessionVolume(s);
                      return (
                        <GlassCard key={s.id} className="overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : s.id)}
                            className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-white/[0.02] transition-colors"
                          >
                            <ExerciseIcon muscle={sessionMuscle(s)} size="md" />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm text-zinc-200 truncate flex items-center gap-2">
                                {prettyName(s)}
                                {s.source === "manual" ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-zinc-500 font-bold uppercase tracking-wider border border-white/[0.08] rounded px-1 py-px">
                                    <NotebookPen className="h-2.5 w-2.5" /> Log
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-cyan-400/70 font-bold uppercase tracking-wider">
                                    <Camera className="h-2.5 w-2.5" /> AI
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-600 mt-0.5">
                                {new Date(s.startTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                                {s.sets?.length ? ` · ${s.sets.length} sets` : ""} · {s.reps.length} reps
                                {volume > 0 ? ` · ${formatVolume(volume, unit)}` : ""}
                              </div>
                            </div>
                            <span
                              className={cn(
                                "text-lg font-black tabular-nums shrink-0",
                                s.totalScore >= 85 ? "text-emerald-400" : s.totalScore >= 65 ? "text-amber-400" : "text-rose-400",
                              )}
                            >
                              {s.totalScore}
                            </span>
                            <ChevronDown
                              className={cn("h-4 w-4 text-zinc-600 shrink-0 transition-transform", isOpen && "rotate-180")}
                            />
                          </button>

                          {isOpen && (
                            <div className="px-4 pb-4 pt-1 border-t border-white/[0.04]">
                              {s.sets?.length ? (
                                <div className="mt-2">
                                  <div className="grid grid-cols-3 gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-600 px-1 mb-1.5">
                                    <span>Set</span>
                                    <span>Weight</span>
                                    <span>Reps</span>
                                  </div>
                                  {s.sets.map((st, i) => (
                                    <div key={i} className="grid grid-cols-3 gap-2 text-sm py-1.5 px-1 border-b border-white/[0.03] last:border-0">
                                      <span className="text-zinc-500 tabular-nums">{i + 1}</span>
                                      <span className="text-zinc-200 tabular-nums">
                                        {st.weight ? formatWeight(st.weight, unit) : "Bodyweight"}
                                      </span>
                                      <span className="text-zinc-200 tabular-nums">{st.reps}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-2 grid grid-cols-3 gap-2.5">
                                  <Stat label="Reps" value={`${s.reps.length}`} icon={<Repeat className="h-3 w-3 text-cyan-400" />} />
                                  <Stat
                                    label="Best Rep"
                                    value={`${s.bestRepScore ?? Math.max(0, ...s.reps.map((r) => r.score))}`}
                                    icon={<Dumbbell className="h-3 w-3 text-emerald-400" />}
                                  />
                                  <Stat
                                    label="Weight"
                                    value={s.weight ? formatWeight(s.weight, unit) : "—"}
                                    icon={<Dumbbell className="h-3 w-3 text-zinc-500" />}
                                  />
                                </div>
                              )}
                              {(s.mistakeSummary?.length ?? 0) > 0 && (
                                <div className="mt-3 text-[11px] text-zinc-500">
                                  Issues: {s.mistakeSummary!.slice(0, 3).map((m) => `${m.issue} (x${m.count})`).join(" · ")}
                                </div>
                              )}
                            </div>
                          )}
                        </GlassCard>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass-card rounded-lg px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-[0.12em] text-zinc-600 mb-0.5 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-bold text-zinc-200 tabular-nums">{value}</div>
    </div>
  );
}
