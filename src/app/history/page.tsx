"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { ExerciseIcon } from "@/components/exercise-icon";
import { ExerciseHowTo } from "@/components/exercise-how-to";
import { getSessions, getWorkouts, fetchSessions, updateWorkoutName } from "@/lib/storage";
import { buildWorkoutGroups, formatWorkoutDate, type WorkoutGroup } from "@/lib/workout-groups";
import { findLibraryByKey } from "@/lib/exercises/library";
import { WeightUnit, getWeightUnit, formatWeight, formatVolume } from "@/lib/units";
import { WorkoutSession } from "@/types";
import {
  Calendar,
  Camera,
  ChevronDown,
  Dumbbell,
  NotebookPen,
  Pencil,
  Repeat,
  Search,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SourceFilter = "all" | "manual" | "camera";

function prettyName(s: WorkoutSession): string {
  return (
    s.exerciseName ||
    s.exercise
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

function sessionVolume(s: WorkoutSession): number {
  if (s.sets?.length) return s.sets.reduce((n, st) => n + (st.weight ?? 0) * st.reps, 0);
  return (s.weight ?? 0) * s.reps.length;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [workouts, setWorkouts] = useState(getWorkouts());
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [unit, setUnit] = useState<WeightUnit>("lbs");

  const refresh = () => {
    setSessions(getSessions());
    setWorkouts(getWorkouts());
    setUnit(getWeightUnit());
  };

  useEffect(() => {
    queueMicrotask(refresh);
    void fetchSessions().then((s) => { setSessions(s); refresh(); }).catch(() => {});
  }, []);

  const groups = useMemo(() => {
    let list = buildWorkoutGroups(sessions, workouts);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.sessions.some((s) => prettyName(s).toLowerCase().includes(q)),
      );
    }
    if (source === "manual") list = list.filter((g) => g.hasManual);
    if (source === "camera") list = list.filter((g) => g.hasCamera);
    return list;
  }, [sessions, workouts, query, source]);

  const saveName = (id: string) => {
    updateWorkoutName(id, editName);
    setWorkouts(getWorkouts());
    setEditingId(null);
  };

  return (
    <div className="min-h-[100dvh] has-bottom-nav md:pb-0">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em]">History</h1>
          <p className="text-zinc-500 mt-2">
            Full workouts by day — tap a workout to see every exercise and set logged
          </p>
        </motion.div>

        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search workout name or exercise..."
              className="w-full h-12 rounded-xl bg-secondary border border-border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 glass-card rounded-xl p-1.5">
            {(["all", "manual", "camera"] as SourceFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setSource(f)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold min-h-[40px] transition-colors",
                  source === f ? "bg-cyan-500/10 text-cyan-300" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {f === "all" ? "All" : f === "manual" ? "Logged" : "Camera"}
              </button>
            ))}
          </div>
        </div>

        {groups.length === 0 ? (
          <GlassCard className="p-10 text-center text-sm text-zinc-500">No workouts match.</GlassCard>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <WorkoutCard
                key={g.id}
                group={g}
                unit={unit}
                isOpen={expanded === g.id}
                onToggle={() => setExpanded(expanded === g.id ? null : g.id)}
                editing={editingId === g.id}
                editName={editName}
                onStartEdit={() => { setEditingId(g.id); setEditName(g.name); }}
                onEditName={setEditName}
                onSaveName={() => saveName(g.id)}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkoutCard({
  group: g,
  unit,
  isOpen,
  onToggle,
  editing,
  editName,
  onStartEdit,
  onEditName,
  onSaveName,
  onCancelEdit,
}: {
  group: WorkoutGroup;
  unit: WeightUnit;
  isOpen: boolean;
  onToggle: () => void;
  editing: boolean;
  editName: string;
  onStartEdit: () => void;
  onEditName: (v: string) => void;
  onSaveName: () => void;
  onCancelEdit: () => void;
}) {
  return (
    <GlassCard className="overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full text-left px-4 py-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  value={editName}
                  onChange={(e) => onEditName(e.target.value)}
                  placeholder="e.g. Legs and Back"
                  className="flex-1 h-9 rounded-lg bg-secondary border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
                <button type="button" onClick={onSaveName} className="h-9 w-9 rounded-lg bg-cyan-500/15 text-cyan-300 flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </button>
                <button type="button" onClick={onCancelEdit} className="h-9 w-9 rounded-lg text-zinc-500 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-100 truncate">{g.name}</h3>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
                  className="shrink-0 text-zinc-600 hover:text-cyan-400 transition-colors"
                  title="Rename workout"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
              <Calendar className="h-3 w-3 text-cyan-400" />
              {formatWorkoutDate(g.date, g.startTime)}
              <span>·</span>
              {g.exerciseCount} exercise{g.exerciseCount !== 1 ? "s" : ""}
              <span>·</span>
              {g.totalReps} reps
              {g.totalVolume > 0 && (
                <>
                  <span>·</span>
                  {formatVolume(g.totalVolume, unit)}
                </>
              )}
            </div>
            {/* Exercise preview chips when collapsed */}
            {!isOpen && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {g.sessions.slice(0, 4).map((s) => (
                  <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 truncate max-w-[140px]">
                    {prettyName(s)}
                  </span>
                ))}
                {g.sessions.length > 4 && (
                  <span className="text-[10px] text-zinc-600">+{g.sessions.length - 4} more</span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={cn(
                "text-2xl font-black tabular-nums",
                g.avgScore >= 85 ? "text-emerald-400" : g.avgScore >= 65 ? "text-amber-400" : "text-rose-400",
              )}
            >
              {g.avgScore}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-zinc-600 transition-transform", isOpen && "rotate-180")} />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-white/[0.04] px-4 pb-4 pt-2 space-y-4">
          {g.sessions.map((s) => (
            <div key={s.id} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
              <div className="flex items-start gap-3">
                <ExerciseIcon exerciseId={s.exercise} exerciseName={prettyName(s)} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-200">{prettyName(s)}</span>
                    {s.source === "manual" ? (
                      <NotebookPen className="h-3 w-3 text-zinc-500" />
                    ) : (
                      <Camera className="h-3 w-3 text-cyan-400/70" />
                    )}
                    <span
                      className={cn(
                        "ml-auto text-sm font-black tabular-nums",
                        s.totalScore >= 85 ? "text-emerald-400" : s.totalScore >= 65 ? "text-amber-400" : "text-rose-400",
                      )}
                    >
                      {s.totalScore}
                    </span>
                  </div>

                  {s.sets?.length ? (
                    <div className="mt-2.5">
                      <div className="grid grid-cols-3 gap-2 text-[9px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                        <span>Set</span>
                        <span>Weight</span>
                        <span>Reps</span>
                      </div>
                      {s.sets.map((st, i) => (
                        <div key={i} className="grid grid-cols-3 gap-2 text-sm py-1 border-b border-white/[0.03] last:border-0 tabular-nums">
                          <span className="text-zinc-500">{i + 1}</span>
                          <span className="text-zinc-200">{st.weight ? formatWeight(st.weight, unit) : "BW"}</span>
                          <span className="text-zinc-200">{st.reps}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-zinc-500 flex gap-3">
                      <span className="flex items-center gap-1"><Repeat className="h-3 w-3" /> {s.reps.length} reps</span>
                      {s.weight != null && (
                        <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3" /> {formatWeight(s.weight, unit)}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <ExerciseHowTo
                  exerciseId={findLibraryByKey(s.exercise)?.id ?? s.exercise}
                  exerciseName={prettyName(s)}
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
