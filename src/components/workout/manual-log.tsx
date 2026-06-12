"use client";

import { useState } from "react";
import { LoggedSet } from "@/types";
import { getSessions, saveSession, updateStreak, saveWorkout } from "@/lib/storage";
import { ManualRating } from "@/lib/manual-rating";
import { buildManualSession, resolveExerciseKey } from "@/lib/manual-session";
import { searchLibrary, EXERCISE_LIBRARY } from "@/lib/exercises/library";
import { ExerciseIcon } from "@/components/exercise-icon";
import { getWeightUnit, toStoredLbs } from "@/lib/units";
import { fetchManualCoachFeedback } from "@/lib/ai/manual-coach-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2, Check, NotebookPen, Trophy, Lightbulb, Sparkles, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualLogProps {
  onClose: () => void;
  /** Called after a session is saved so parents can refresh their data. */
  onLogged?: () => void;
}

interface SetDraft {
  reps: string;
  weight: string;
}

export function ManualLog({ onClose, onLogged }: ManualLogProps) {
  const [step, setStep] = useState<"pick" | "sets" | "done">("pick");
  const [query, setQuery] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState<SetDraft[]>([{ reps: "", weight: "" }]);
  const [rating, setRating] = useState<ManualRating | null>(null);
  const [unit] = useState(() => getWeightUnit());
  /** null = loading, "" = unavailable (fallback), text = AI feedback */
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const filtered = searchLibrary(query);
  const customName = query.trim();
  const showCustomOption =
    customName.length > 1 && !EXERCISE_LIBRARY.some((e) => e.name.toLowerCase() === customName.toLowerCase());

  const pickExercise = (name: string) => {
    setExerciseName(name);
    setStep("sets");
  };

  const updateSet = (i: number, field: keyof SetDraft, value: string) => {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addSet = () => {
    // Prefill from the previous set — most sets repeat the same weight.
    setSets((prev) => [...prev, { reps: "", weight: prev[prev.length - 1]?.weight ?? "" }]);
  };

  const removeSet = (i: number) => {
    setSets((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  };

  const parsedSets: LoggedSet[] = sets
    .map((s) => {
      const entered = s.weight ? Math.max(0, parseFloat(s.weight)) : 0;
      return {
        reps: parseInt(s.reps) || 0,
        weight: entered > 0 ? toStoredLbs(entered, unit) : undefined,
      };
    })
    .filter((s) => s.reps > 0);

  const canSave = parsedSets.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const now = Date.now();
    const workoutId = `workout-${crypto.randomUUID()}`;
    const { session, rating: result } = buildManualSession(exerciseName, parsedSets, getSessions(), {
      endTime: now,
      workoutId,
    });
    saveWorkout({
      id: workoutId,
      date: new Date(now).toISOString().slice(0, 10),
      startTime: session.startTime,
      endTime: now,
    });
    saveSession(session);
    void updateStreak();
    setRating(result);
    setStep("done");
    onLogged?.();

    setAiFeedback(null);
    void fetchManualCoachFeedback({
      exerciseName,
      exerciseKey: resolveExerciseKey(exerciseName),
      sets: parsedSets,
      ratingScore: result.score,
      unit,
      sessions: getSessions(),
    }).then(setAiFeedback);
  };

  const reset = () => {
    setQuery("");
    setExerciseName("");
    setSets([{ reps: "", weight: "" }]);
    setRating(null);
    setAiFeedback(null);
    setStep("pick");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="w-full md:max-w-lg max-h-[88vh] overflow-hidden bg-card border-border rounded-t-2xl md:rounded-xl md:mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 md:px-6 md:pt-6 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <NotebookPen className="h-4 w-4 text-cyan-400" />
            <h2 className="text-lg font-bold">
              {step === "pick" && "Log Workout"}
              {step === "sets" && exerciseName}
              {step === "done" && "Session Rated"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="min-h-[44px] min-w-[44px]">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 md:px-6">
          {/* ── Pick exercise ── */}
          {step === "pick" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                No camera needed — log the sets you did and get a rating based on your history.
              </p>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or type any exercise..."
                className="w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                {showCustomOption && (
                  <button
                    onClick={() => pickExercise(customName)}
                    className="w-full flex items-center justify-between rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2.5 text-sm hover:bg-cyan-500/15 text-left"
                  >
                    <span>Log &ldquo;{customName}&rdquo;</span>
                    <Badge variant="outline" className="text-[9px]">Custom</Badge>
                  </button>
                )}
                {filtered.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => pickExercise(e.name)}
                    className="w-full flex items-center gap-2.5 rounded-lg bg-secondary/30 px-2.5 py-2 text-sm hover:bg-secondary active:bg-secondary text-left"
                  >
                    <ExerciseIcon exerciseId={e.id} exerciseName={e.name} size="sm" />
                    <span className="truncate flex-1">{e.name}</span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-600 shrink-0">{e.muscle}</span>
                  </button>
                ))}
                {filtered.length === 0 && !showCustomOption && (
                  <p className="text-sm text-muted-foreground text-center py-4">Keep typing to log a custom exercise.</p>
                )}
              </div>
            </div>
          )}

          {/* ── Enter sets ── */}
          {step === "sets" && (
            <div className="space-y-3">
              <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground px-1">
                <span>Set</span>
                <span>Weight ({unit})</span>
                <span>Reps</span>
                <span />
              </div>
              {sets.map((s, i) => (
                <div key={i} className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-2 items-center">
                  <span className="text-sm font-bold text-zinc-400 tabular-nums text-center">{i + 1}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={s.weight}
                    onChange={(e) => updateSet(i, "weight", e.target.value)}
                    placeholder="—"
                    min="0"
                    className="h-11 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.reps}
                    onChange={(e) => updateSet(i, "reps", e.target.value)}
                    placeholder="0"
                    min="0"
                    autoFocus={i === 0}
                    className="h-11 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSet(i)}
                    disabled={sets.length === 1}
                    className="h-9 w-9 text-destructive disabled:opacity-20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addSet} className="w-full min-h-[44px] border-dashed">
                <Plus className="h-4 w-4" /> Add Set
              </Button>
              <p className="text-[11px] text-muted-foreground">Leave weight empty for bodyweight sets.</p>
            </div>
          )}

          {/* ── Rating result ── */}
          {step === "done" && rating && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div
                  className={cn(
                    "text-6xl font-black tabular-nums",
                    rating.score >= 85 ? "text-emerald-400" : rating.score >= 65 ? "text-amber-400" : "text-rose-400",
                  )}
                >
                  {rating.score}
                </div>
                <div className="text-xs text-muted-foreground mt-1">session rating</div>
                <p className="text-sm text-zinc-300 mt-3">{rating.summary}</p>
              </div>

              {/* AI coach feedback — loads async; deterministic tips remain below */}
              {aiFeedback !== "" && (
                <div className="rounded-xl bg-cyan-500/[0.06] border border-cyan-500/15 p-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-400 mb-2">
                    <Bot className="h-3.5 w-3.5" /> AI Coach
                  </div>
                  {aiFeedback === null ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 rounded bg-white/[0.06] w-full" />
                      <div className="h-3 rounded bg-white/[0.06] w-11/12" />
                      <div className="h-3 rounded bg-white/[0.06] w-3/5" />
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-200 leading-relaxed">{aiFeedback}</p>
                  )}
                </div>
              )}

              {rating.highlights.length > 0 && (
                <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 p-3.5 space-y-2">
                  {rating.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-emerald-200">
                      {h.includes("PR") || h.includes("Biggest") ? (
                        <Trophy className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
                      ) : (
                        <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
                      )}
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {rating.tips.length > 0 && (
                <div className="rounded-xl bg-secondary/40 border border-border/50 p-3.5 space-y-2">
                  {rating.tips.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 md:px-6 border-t border-border/50 shrink-0"
          style={{ paddingBottom: "max(0.75rem, var(--safe-bottom))" }}
        >
          {step === "sets" && (
            <Button onClick={handleSave} disabled={!canSave} className="w-full min-h-[48px]">
              <Check className="h-4 w-4" /> Save & Rate Workout
            </Button>
          )}
          {step === "done" && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1 min-h-[48px]">
                <Plus className="h-4 w-4" /> Log Another
              </Button>
              <Button onClick={onClose} className="flex-1 min-h-[48px]">
                Done
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
