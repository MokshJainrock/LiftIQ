"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { RestTimer } from "@/components/workout/rest-timer";
import {
  EXERCISE_LIBRARY,
  LibraryExercise,
  MUSCLE_GROUPS,
  MuscleGroup,
  getLibraryExercise,
  searchLibrary,
} from "@/lib/exercises/library";
import { buildManualSession, resolveExerciseKey } from "@/lib/manual-session";
import { getSessions, saveSession, updateStreak } from "@/lib/storage";
import { LoggedSet } from "@/types";
import { ManualRating } from "@/lib/manual-rating";
import { ExerciseIcon } from "@/components/exercise-icon";
import { findLibraryExerciseByName } from "@/lib/exercises/library";
import { WeightUnit, getWeightUnit, toStoredLbs, formatVolume } from "@/lib/units";
import {
  fetchManualCoachFeedback,
  fetchAISuggestions,
  type AISuggestion,
} from "@/lib/ai/manual-coach-client";
import {
  Check,
  Plus,
  Trash2,
  X,
  Timer,
  Flame,
  Dumbbell,
  Trophy,
  Lightbulb,
  Sparkles,
  ChevronDown,
  Square,
  Bot,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveSet {
  weight: string;
  reps: string;
  done: boolean;
}

interface LiveExercise {
  libId: string;
  name: string;
  muscle: string;
  cue: string;
  isWeighted: boolean;
  restSec: number;
  sets: LiveSet[];
}

interface ExerciseResult {
  name: string;
  sets: number;
  reps: number;
  volume: number; // lbs
  rating: ManualRating;
}

const DRAFT_KEY = "liftiq-live-workout-draft";
const REST_OPTIONS = [30, 60, 90, 120, 180];

function newLiveExercise(lib: LibraryExercise): LiveExercise {
  return {
    libId: lib.id,
    name: lib.name,
    muscle: lib.muscle,
    cue: lib.cue,
    isWeighted: lib.isWeighted,
    restSec: lib.defaultRestSec,
    sets: [{ weight: "", reps: "", done: false }],
  };
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LiveWorkoutPage() {
  const router = useRouter();
  const [startedAt, setStartedAt] = useState<number>(0);
  const [now, setNow] = useState<number>(0);
  const [exercises, setExercises] = useState<LiveExercise[]>([]);
  const [resting, setResting] = useState<{ exIdx: number; seconds: number } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerMuscle, setPickerMuscle] = useState<MuscleGroup | "all">("all");
  const [results, setResults] = useState<ExerciseResult[] | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [unit, setUnit] = useState<WeightUnit>("lbs");
  /** AI coach note per finished exercise name; null = loading. */
  const [aiNotes, setAiNotes] = useState<Record<string, string | null>>({});
  const [aiSuggest, setAiSuggest] = useState<{
    loading: boolean;
    focus: string;
    suggestions: AISuggestion[];
  } | null>(null);
  const restoredRef = useRef(false);

  // Restore a draft (page refresh mid-workout) or start fresh, then apply
  // the ?exercise= preselect from the library page.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    queueMicrotask(() => {
      let start = Date.now();
      let restored: LiveExercise[] = [];
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw) as { startedAt: number; exercises: LiveExercise[] };
          // Drafts older than 6h are stale gym sessions — drop them.
          if (Date.now() - draft.startedAt < 6 * 60 * 60 * 1000 && draft.exercises.length > 0) {
            start = draft.startedAt;
            restored = draft.exercises;
          }
        }
      } catch {
        // corrupt draft — ignore
      }

      const param = new URLSearchParams(window.location.search).get("exercise");
      if (param) {
        const lib = getLibraryExercise(param);
        if (lib && !restored.some((e) => e.libId === lib.id)) {
          restored = [...restored, newLiveExercise(lib)];
        }
      }

      setStartedAt(start);
      setNow(Date.now());
      setExercises(restored);
      setUnit(getWeightUnit());
      if (restored.length === 0) setShowPicker(true);
    });
  }, []);

  // Wall-clock elapsed timer — stays accurate when the tab sleeps.
  useEffect(() => {
    if (!startedAt || results) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt, results]);

  // Persist draft.
  useEffect(() => {
    if (!startedAt || results) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ startedAt, exercises }));
    } catch {
      // storage full — non-fatal
    }
  }, [startedAt, exercises, results]);

  // Always in lbs (storage unit); converted for display only.
  const totalVolume = useMemo(
    () =>
      exercises.reduce(
        (sum, ex) =>
          sum +
          ex.sets.reduce(
            (n, s) =>
              s.done ? n + toStoredLbs(parseFloat(s.weight) || 0, unit) * (parseInt(s.reps) || 0) : n,
            0,
          ),
        0,
      ),
    [exercises, unit],
  );
  const completedSets = exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.done).length, 0);

  const addExercise = (lib: LibraryExercise) => {
    setExercises((prev) => [...prev, newLiveExercise(lib)]);
    setShowPicker(false);
    setPickerQuery("");
  };

  const removeExercise = (i: number) => {
    setExercises((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateSet = (exIdx: number, setIdx: number, field: "weight" | "reps", value: string) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)) }
          : ex,
      ),
    );
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                { weight: ex.sets[ex.sets.length - 1]?.weight ?? "", reps: "", done: false },
              ],
            }
          : ex,
      ),
    );
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx && ex.sets.length > 1
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
          : ex,
      ),
    );
  };

  const setRest = (exIdx: number, restSec: number) => {
    setExercises((prev) => prev.map((ex, i) => (i === exIdx ? { ...ex, restSec } : ex)));
  };

  const completeSet = (exIdx: number, setIdx: number) => {
    const ex = exercises[exIdx];
    const set = ex.sets[setIdx];
    if (!set.done && (parseInt(set.reps) || 0) <= 0) return;
    const togglingOn = !set.done;
    setExercises((prev) =>
      prev.map((e, i) =>
        i === exIdx
          ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, done: !s.done } : s)) }
          : e,
      ),
    );
    if (togglingOn) {
      setResting({ exIdx, seconds: ex.restSec });
    }
  };

  const endRest = useCallback(() => setResting(null), []);

  const finishWorkout = () => {
    const end = Date.now();
    const history = getSessions();
    const out: ExerciseResult[] = [];

    for (const ex of exercises) {
      const sets: LoggedSet[] = ex.sets
        .filter((s) => s.done && (parseInt(s.reps) || 0) > 0)
        .map((s) => {
          const entered = s.weight ? Math.max(0, parseFloat(s.weight)) : 0;
          return {
            reps: parseInt(s.reps) || 0,
            weight: entered > 0 ? toStoredLbs(entered, unit) : undefined,
          };
        });
      if (sets.length === 0) continue;
      const { session, rating } = buildManualSession(ex.name, sets, history, {
        startTime: startedAt,
        endTime: end,
      });
      saveSession(session);
      history.push(session);
      out.push({
        name: ex.name,
        sets: sets.length,
        reps: sets.reduce((n, s) => n + s.reps, 0),
        volume: sets.reduce((n, s) => n + (s.weight ?? 0) * s.reps, 0),
        rating,
      });
    }

    if (out.length > 0) void updateStreak();

    // Kick off AI coaching for each finished exercise (async, non-blocking).
    const loading: Record<string, string | null> = {};
    for (const r of out) loading[r.name] = null;
    setAiNotes(loading);
    for (const r of out) {
      const sets =
        history
          .filter((s) => s.exerciseName === r.name)
          .slice(-1)[0]?.sets ?? [];
      void fetchManualCoachFeedback({
        exerciseName: r.name,
        exerciseKey: resolveExerciseKey(r.name),
        sets,
        ratingScore: r.rating.score,
        unit,
        sessions: history,
      }).then((text) => {
        setAiNotes((prev) => ({ ...prev, [r.name]: text }));
      });
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setResting(null);
    setResults(out);
  };

  const discard = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    router.push("/workout");
  };

  const handleAISuggest = async () => {
    setAiSuggest({ loading: true, focus: "", suggestions: [] });
    const res = await fetchAISuggestions(getSessions());
    setAiSuggest({ loading: false, focus: res.focus, suggestions: res.suggestions });
  };

  const addSuggested = (name: string) => {
    const lib = findLibraryExerciseByName(name);
    if (lib) addExercise(lib);
  };

  const pickerResults = searchLibrary(pickerQuery, pickerMuscle);
  const elapsed = startedAt ? now - startedAt : 0;
  const overallScore =
    results && results.length > 0
      ? Math.round(results.reduce((n, r) => n + r.rating.score, 0) / results.length)
      : 0;

  // ── Finished summary ──────────────────────────────────────────
  if (results) {
    return (
      <div className="min-h-[100dvh] has-bottom-nav md:pb-0">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
          {results.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-zinc-400">No completed sets — nothing was saved.</p>
              <Button onClick={() => router.push("/workout")} className="mt-5 min-h-[48px]">
                Back to Training
              </Button>
            </GlassCard>
          ) : (
            <>
              <div className="text-center mb-6">
                <div
                  className={cn(
                    "text-7xl font-black tabular-nums",
                    overallScore >= 85 ? "text-emerald-400" : overallScore >= 65 ? "text-amber-400" : "text-rose-400",
                  )}
                >
                  {overallScore}
                </div>
                <div className="text-xs text-zinc-500 mt-1 uppercase tracking-[0.15em]">workout rating</div>
                <div className="mt-4 flex items-center justify-center gap-5 text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Timer className="h-4 w-4 text-cyan-400" /> {formatDuration(elapsed)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Dumbbell className="h-4 w-4 text-emerald-400" />{" "}
                    {formatVolume(results.reduce((n, r) => n + r.volume, 0), unit)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-cyan-400" /> {results.reduce((n, r) => n + r.sets, 0)} sets
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {results.map((r) => (
                  <GlassCard key={r.name} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ExerciseIcon muscle={findLibraryExerciseByName(r.name)?.muscle ?? "full-body"} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-zinc-200 truncate">{r.name}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            {r.sets} sets · {r.reps} reps{r.volume > 0 ? ` · ${formatVolume(r.volume, unit)}` : ""}
                          </div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-2xl font-black tabular-nums shrink-0",
                          r.rating.score >= 85 ? "text-emerald-400" : r.rating.score >= 65 ? "text-amber-400" : "text-rose-400",
                        )}
                      >
                        {r.rating.score}
                      </span>
                    </div>
                    {aiNotes[r.name] !== "" && (
                      <div className="mt-3 rounded-lg bg-cyan-500/[0.06] border border-cyan-500/15 p-3">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-cyan-400 mb-1.5">
                          <Bot className="h-3 w-3" /> AI Coach
                        </div>
                        {aiNotes[r.name] === null ? (
                          <div className="space-y-1.5 animate-pulse">
                            <div className="h-2.5 rounded bg-white/[0.06] w-full" />
                            <div className="h-2.5 rounded bg-white/[0.06] w-4/5" />
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-200 leading-relaxed">{aiNotes[r.name]}</p>
                        )}
                      </div>
                    )}
                    {r.rating.highlights.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {r.rating.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-emerald-200">
                            {h.includes("PR") || h.includes("Biggest") ? (
                              <Trophy className="h-3.5 w-3.5 mt-px shrink-0 text-amber-400" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 mt-px shrink-0 text-emerald-400" />
                            )}
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {r.rating.tips.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {r.rating.tips.slice(0, 2).map((t, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                            <Lightbulb className="h-3.5 w-3.5 mt-px shrink-0 text-cyan-400" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                ))}
              </div>

              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="flex-1 min-h-[48px]">
                  View Stats
                </Button>
                <Button onClick={() => router.push("/workout")} className="flex-1 min-h-[48px]">
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Live session ──────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] has-bottom-nav md:pb-0">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
              </span>
              <h1 className="text-xl font-extrabold tracking-tight">Live Workout</h1>
            </div>
            <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500 tabular-nums">
              <span className="flex items-center gap-1">
                <Timer className="h-3.5 w-3.5 text-cyan-400" /> {formatDuration(elapsed)}
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-emerald-400" /> {completedSets} sets
              </span>
              {totalVolume > 0 && (
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3.5 w-3.5 text-emerald-400" /> {formatVolume(totalVolume, unit)}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDiscard(true)}
              className="border-white/[0.08] bg-white/[0.02] text-zinc-500 hover:text-rose-400 hover:border-rose-500/20 min-h-[40px]"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={finishWorkout}
              disabled={completedSets === 0}
              className="min-h-[40px] disabled:opacity-40"
            >
              <Square className="h-3.5 w-3.5" /> Finish
            </Button>
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-4">
          {exercises.map((ex, exIdx) => (
            <GlassCard key={`${ex.libId}-${exIdx}`} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <ExerciseIcon muscle={ex.muscle} size="md" />
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-zinc-100 truncate">{ex.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600 mt-0.5">{ex.muscle}</div>
                    <p className="text-[11px] text-zinc-500 mt-1">{ex.cue}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="relative">
                    <select
                      value={ex.restSec}
                      onChange={(e) => setRest(exIdx, parseInt(e.target.value))}
                      className="appearance-none h-8 rounded-lg bg-secondary border border-border pl-2.5 pr-6 text-[11px] text-zinc-300 focus:outline-none"
                      title="Rest between sets"
                    >
                      {REST_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s >= 60 ? `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}` : `${s}s`} rest
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExercise(exIdx)}
                    className="h-8 w-8 text-zinc-600 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-[2rem_1fr_1fr_2.5rem_2.5rem] gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-600 px-1">
                <span>Set</span>
                <span>{ex.isWeighted ? `Weight (${unit})` : `Weight (${unit}, opt.)`}</span>
                <span>Reps</span>
                <span className="text-center">Done</span>
                <span />
              </div>
              <div className="mt-1.5 space-y-1.5">
                {ex.sets.map((s, setIdx) => (
                  <div
                    key={setIdx}
                    className={cn(
                      "grid grid-cols-[2rem_1fr_1fr_2.5rem_2.5rem] gap-2 items-center rounded-lg px-1 py-0.5 transition-colors",
                      s.done && "bg-emerald-500/[0.06]",
                    )}
                  >
                    <span className="text-xs font-bold text-zinc-500 tabular-nums text-center">{setIdx + 1}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={s.weight}
                      onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                      placeholder="—"
                      min="0"
                      disabled={s.done}
                      className="h-10 rounded-lg bg-secondary border border-border px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={s.reps}
                      onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                      placeholder="0"
                      min="0"
                      disabled={s.done}
                      className="h-10 rounded-lg bg-secondary border border-border px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => completeSet(exIdx, setIdx)}
                      className={cn(
                        "h-10 w-10 mx-auto rounded-lg border flex items-center justify-center transition-colors",
                        s.done
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-secondary border-border text-zinc-600 hover:text-emerald-400 hover:border-emerald-500/30",
                      )}
                      title={s.done ? "Undo set" : "Complete set (starts rest timer)"}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSet(exIdx, setIdx)}
                      disabled={ex.sets.length === 1}
                      className="h-9 w-9 text-zinc-700 hover:text-rose-400 disabled:opacity-20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSet(exIdx)}
                className="w-full mt-2.5 min-h-[40px] border-dashed border-white/[0.08] bg-transparent text-zinc-400"
              >
                <Plus className="h-3.5 w-3.5" /> Add Set
              </Button>
            </GlassCard>
          ))}

          <Button
            variant="outline"
            onClick={() => setShowPicker(true)}
            className="w-full min-h-[52px] border-dashed border-cyan-500/20 bg-cyan-500/[0.03] text-cyan-300 hover:bg-cyan-500/10"
          >
            <Plus className="h-4 w-4" /> Add Exercise
          </Button>
        </div>
      </div>

      {/* ── Rest overlay ── */}
      {resting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-6">
          <GlassCard className="w-full max-w-sm p-6">
            <div className="text-center mb-1">
              <div className="text-sm font-bold text-zinc-200">
                {exercises[resting.exIdx]?.name ?? "Rest"}
              </div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mt-0.5">
                next set coming up
              </div>
            </div>
            <RestTimer
              initialSeconds={resting.seconds}
              onComplete={endRest}
              onSkip={endRest}
              label="Rest"
            />
          </GlassCard>
        </div>
      )}

      {/* ── Exercise picker ── */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full md:max-w-lg max-h-[85vh] glass-card bg-card border border-border rounded-t-2xl md:rounded-xl md:mx-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 md:px-5 border-b border-border/50 shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Flame className="h-4 w-4 text-cyan-400" /> Add Exercise
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPicker(false)}
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-4 md:px-5 pt-3 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder={`Search ${EXERCISE_LIBRARY.length} exercises...`}
                  className="flex-1 h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
                <Button
                  variant="outline"
                  onClick={handleAISuggest}
                  disabled={aiSuggest?.loading}
                  className="h-11 px-3 border-cyan-500/20 bg-cyan-500/[0.05] text-cyan-300 hover:bg-cyan-500/10 shrink-0"
                  title="AI suggests what to train based on your history"
                >
                  {aiSuggest?.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                  <span className="hidden sm:inline">AI Suggest</span>
                </Button>
              </div>

              {aiSuggest && !aiSuggest.loading && (
                <div className="mt-2.5 rounded-xl bg-cyan-500/[0.05] border border-cyan-500/15 p-3">
                  {aiSuggest.suggestions.length === 0 ? (
                    <p className="text-xs text-zinc-500">AI suggestions unavailable right now — browse below.</p>
                  ) : (
                    <>
                      {aiSuggest.focus && (
                        <p className="text-xs text-cyan-200 mb-2 flex items-start gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 mt-px shrink-0" /> {aiSuggest.focus}
                        </p>
                      )}
                      <div className="space-y-1.5">
                        {aiSuggest.suggestions.map((s) => {
                          const lib = findLibraryExerciseByName(s.name);
                          return (
                            <button
                              key={s.name}
                              onClick={() => addSuggested(s.name)}
                              className="w-full flex items-center gap-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-2 text-left hover:bg-cyan-500/10 transition-colors"
                            >
                              <ExerciseIcon muscle={lib?.muscle ?? "full-body"} size="sm" />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm text-zinc-100 truncate">{s.name}</span>
                                <span className="block text-[10px] text-zinc-500 truncate">{s.reason}</span>
                              </span>
                              <Plus className="h-4 w-4 text-cyan-400 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="flex gap-1.5 overflow-x-auto py-2.5 -mx-1 px-1">
                <FilterChip active={pickerMuscle === "all"} onClick={() => setPickerMuscle("all")}>
                  All
                </FilterChip>
                {MUSCLE_GROUPS.map((m) => (
                  <FilterChip key={m.id} active={pickerMuscle === m.id} onClick={() => setPickerMuscle(m.id)}>
                    {m.label}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 md:px-5 pb-4 space-y-1.5"
              style={{ paddingBottom: "max(1rem, var(--safe-bottom))" }}
            >
              {pickerResults.map((e) => (
                <button
                  key={e.id}
                  onClick={() => addExercise(e)}
                  className="w-full flex items-center gap-2.5 rounded-lg bg-secondary/30 px-2.5 py-2 text-sm hover:bg-secondary active:bg-secondary text-left"
                >
                  <ExerciseIcon muscle={e.muscle} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-zinc-200">{e.name}</div>
                    <div className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">
                      {e.muscle} · {e.equipment}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-cyan-400 shrink-0" />
                </button>
              ))}
              {pickerResults.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-6">No exercises match.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Discard confirm ── */}
      {confirmDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <GlassCard className="w-full max-w-sm p-6">
            <h3 className="font-bold text-zinc-100">Discard workout?</h3>
            <p className="text-sm text-zinc-500 mt-1.5">Completed sets will not be saved.</p>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" onClick={() => setConfirmDiscard(false)} className="flex-1 min-h-[44px]">
                Keep Going
              </Button>
              <Button
                onClick={discard}
                className="flex-1 min-h-[44px] bg-rose-500/90 hover:bg-rose-500 text-white"
              >
                Discard
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function FilterChip({
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
        "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors border",
        active
          ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
          : "bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-zinc-300",
      )}
    >
      {children}
    </button>
  );
}
