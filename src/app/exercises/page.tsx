"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";
import {
  EXERCISE_LIBRARY,
  EQUIPMENT_LABELS,
  Equipment,
  LibraryExercise,
  MUSCLE_GROUPS,
  MuscleGroup,
  searchLibrary,
} from "@/lib/exercises/library";
import { Camera, ChevronRight, Play, Search } from "lucide-react";
import { ExerciseIcon } from "@/components/exercise-icon";
import { ExerciseDemo } from "@/components/exercise-demo";
import { ExerciseDetailModal } from "@/components/exercise-detail-modal";
import { resolveExerciseGif } from "@/lib/exercises/exercise-gif";
import { cn } from "@/lib/utils";

const EQUIPMENT_FILTERS: (Equipment | "all")[] = [
  "all",
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
  "band",
  "cardio",
];

export default function ExercisesPage() {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "all">("all");
  const [equipment, setEquipment] = useState<Equipment | "all">("all");
  const [selected, setSelected] = useState<LibraryExercise | null>(null);

  const results = useMemo(() => searchLibrary(query, muscle, equipment), [query, muscle, equipment]);

  const grouped = useMemo(() => {
    const map = new Map<MuscleGroup, typeof results>();
    for (const e of results) {
      const list = map.get(e.muscle) ?? [];
      list.push(e);
      map.set(e.muscle, list);
    }
    return MUSCLE_GROUPS.filter((m) => map.has(m.id)).map((m) => ({
      label: m.label,
      items: map.get(m.id)!,
    }));
  }, [results]);

  return (
    <div className="min-h-[100dvh] has-bottom-nav md:pb-0">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em]">Exercises</h1>
          <p className="text-zinc-500 mt-2">
            {EXERCISE_LIBRARY.length} movements — tap any for demo, steps & form tips
          </p>
        </motion.div>

        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises..."
              className="w-full h-12 rounded-xl bg-secondary border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
            <Chip active={muscle === "all"} onClick={() => setMuscle("all")}>
              All Muscles
            </Chip>
            {MUSCLE_GROUPS.map((m) => (
              <Chip key={m.id} active={muscle === m.id} onClick={() => setMuscle(m.id)}>
                {m.label}
              </Chip>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
            {EQUIPMENT_FILTERS.map((eq) => (
              <Chip key={eq} active={equipment === eq} onClick={() => setEquipment(eq)}>
                {eq === "all" ? "All Equipment" : EQUIPMENT_LABELS[eq]}
              </Chip>
            ))}
          </div>
        </div>

        {grouped.length === 0 ? (
          <GlassCard className="p-10 text-center text-zinc-500 text-sm">No exercises match your filters.</GlassCard>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <section key={group.label}>
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 mb-3">
                  {group.label}
                  <span className="ml-2 text-zinc-700">{group.items.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {group.items.map((e) => (
                    <ExerciseCard key={e.id} exercise={e} onOpen={() => setSelected(e)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ExerciseCard({
  exercise: e,
  onOpen,
}: {
  exercise: LibraryExercise;
  onOpen: () => void;
}) {
  const hasGif = !!resolveExerciseGif(e.id, e.name);

  return (
    <GlassCard className="p-4 flex flex-col justify-between gap-3 hover:bg-white/[0.03] transition-colors">
      <button type="button" onClick={onOpen} className="text-left flex flex-col gap-3 group">
        <div className="flex items-start gap-3">
          <ExerciseIcon exerciseId={e.id} exerciseName={e.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-sm text-zinc-100 group-hover:text-cyan-200 transition-colors">
                {e.name}
              </span>
              {e.trackingId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300 shrink-0">
                  <Camera className="h-2.5 w-2.5" /> AI
                </span>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-600 mt-1">
              {EQUIPMENT_LABELS[e.equipment]} · rest {e.defaultRestSec}s
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">{e.cue}</p>
          </div>
        </div>

        <div className="relative rounded-xl border border-white/[0.06] overflow-hidden bg-[#0a0a0f]">
          <ExerciseDemo exerciseId={e.id} exerciseName={e.name} variant="preview" compact />
          <div className="absolute inset-0 flex items-end justify-between p-2 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {hasGif ? "Human demo" : "Form guide"}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-cyan-400">
              Steps & tips <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </button>

      <div className="flex gap-2">
        <Link
          href={`/workout/live?exercise=${e.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/15 transition-colors min-h-[38px]"
        >
          <Play className="h-3 w-3" /> Start
        </Link>
        {e.trackingId && (
          <Link
            href={`/workout?exercise=${e.trackingId}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors min-h-[38px]"
            title="Train with camera form analysis"
          >
            <Camera className="h-3 w-3" />
          </Link>
        )}
      </div>
    </GlassCard>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors border min-h-[32px]",
        active
          ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
          : "bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-zinc-300",
      )}
    >
      {children}
    </button>
  );
}
