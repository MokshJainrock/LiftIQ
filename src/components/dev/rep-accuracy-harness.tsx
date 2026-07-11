"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePoseDetection } from "@/lib/pose/use-pose-detection";
import { RepDetector } from "@/lib/scoring/rep-detector";
import { exercises } from "@/lib/exercises";
import type { Landmark } from "@/types";

/**
 * INTERNAL rep-counter accuracy harness (dev-only — see the page wrapper).
 *
 * Do a set in front of the camera, tell it how many reps you actually did, and
 * it records detected-vs-actual so we get a REAL accuracy figure over time
 * (the synthetic `npm run test:reps` only guards the counting logic). All data
 * lives in localStorage and is never sent anywhere.
 */

const STORAGE_KEY = "liftiq-dev-rep-accuracy";

interface LogEntry {
  id: string;
  ts: number;
  exercise: string;
  detected: number;
  actual: number;
}

const TRACKABLE = Object.entries(exercises)
  .filter(([, c]) => c.repCycle)
  .map(([id, c]) => ({ id, name: c.name }));

function loadLogs(): LogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs: LogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    /* ignore quota errors */
  }
}

interface Metrics {
  sets: number;
  totalActual: number;
  totalDetected: number;
  absErr: number;
  mae: number | null;
  repAccuracy: number | null;
  exactRate: number | null;
}

function computeMetrics(logs: LogEntry[]): Metrics {
  const sets = logs.length;
  const totalActual = logs.reduce((s, l) => s + l.actual, 0);
  const totalDetected = logs.reduce((s, l) => s + l.detected, 0);
  const absErr = logs.reduce((s, l) => s + Math.abs(l.detected - l.actual), 0);
  const exact = logs.filter((l) => l.detected === l.actual).length;
  return {
    sets,
    totalActual,
    totalDetected,
    absErr,
    mae: sets > 0 ? absErr / sets : null,
    repAccuracy: totalActual > 0 ? Math.max(0, 1 - absErr / totalActual) : null,
    exactRate: sets > 0 ? exact / sets : null,
  };
}

const pct = (v: number | null) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);
const num = (v: number | null) => (v == null ? "—" : v.toFixed(2));

export function RepAccuracyHarness() {
  const [exerciseId, setExerciseId] = useState(TRACKABLE[0]?.id ?? "squat");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [running, setRunning] = useState(false);
  const [detected, setDetected] = useState(0);
  const [phase, setPhase] = useState("");
  const [trust, setTrust] = useState(0);
  const [actual, setActual] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const detectorRef = useRef<RepDetector | null>(null);

  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  // (Re)build the detector whenever the exercise changes.
  useEffect(() => {
    const config = exercises[exerciseId];
    detectorRef.current = config ? new RepDetector(config) : null;
    setDetected(0);
    setPhase("");
    setTrust(0);
  }, [exerciseId]);

  const handleFrame = useCallback((landmarks: Landmark[]) => {
    const det = detectorRef.current;
    if (!det) return;
    const res = det.update(landmarks);
    setDetected(res.repCount);
    setPhase(res.phase);
    setTrust(res.frameTrust);
  }, []);

  const { videoRef, canvasRef, status } = usePoseDetection({
    onFrame: handleFrame,
    enabled: running,
    facingMode: facing,
  });

  const resetSet = useCallback(() => {
    const config = exercises[exerciseId];
    detectorRef.current = config ? new RepDetector(config) : null;
    setDetected(0);
    setPhase("");
  }, [exerciseId]);

  const logResult = useCallback(() => {
    const actualNum = parseInt(actual, 10);
    if (!Number.isFinite(actualNum) || actualNum < 0) return;
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: Date.now(),
      exercise: exerciseId,
      detected,
      actual: actualNum,
    };
    setLogs((prev) => {
      const next = [entry, ...prev];
      saveLogs(next);
      return next;
    });
    setActual("");
    resetSet();
  }, [actual, detected, exerciseId, resetSet]);

  const deleteLog = useCallback((id: string) => {
    setLogs((prev) => {
      const next = prev.filter((l) => l.id !== id);
      saveLogs(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    if (!window.confirm("Clear ALL logged accuracy data?")) return;
    setLogs([]);
    saveLogs([]);
  }, []);

  const filteredLogs = useMemo(
    () => (filter === "all" ? logs : logs.filter((l) => l.exercise === filter)),
    [logs, filter],
  );
  const overall = useMemo(() => computeMetrics(logs), [logs]);
  const filtered = useMemo(() => computeMetrics(filteredLogs), [filteredLogs]);

  const perExercise = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    for (const l of logs) {
      const arr = map.get(l.exercise) ?? [];
      arr.push(l);
      map.set(l.exercise, arr);
    }
    return Array.from(map.entries())
      .map(([id, entries]) => ({ id, name: exercises[id]?.name ?? id, m: computeMetrics(entries) }))
      .sort((a, b) => b.m.sets - a.m.sets);
  }, [logs]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            INTERNAL · DEV ONLY
          </div>
          <h1 className="text-2xl font-bold">Rep-Counter Accuracy Harness</h1>
          <p className="text-sm text-zinc-400">
            Do a real set, enter the true rep count, and log it. Metrics are stored
            locally in your browser only. Not reachable in production builds.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ─── Live capture ─── */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              >
                {TRACKABLE.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setRunning((r) => !r)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  running ? "bg-red-500/90 hover:bg-red-500" : "bg-emerald-500/90 hover:bg-emerald-500"
                }`}
              >
                {running ? "Stop camera" : "Start camera"}
              </button>
              <button
                onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800"
              >
                {facing === "user" ? "Front cam" : "Rear cam"}
              </button>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-black">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
              {!running && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
                  Camera off
                </div>
              )}
              <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[11px] text-zinc-300">
                {status}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div className="text-3xl font-bold tabular-nums text-cyan-400">{detected}</div>
                <div className="text-xs text-zinc-500">detected reps</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div className="truncate text-lg font-semibold text-zinc-200">{phase || "—"}</div>
                <div className="text-xs text-zinc-500">phase</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div className="text-lg font-semibold tabular-nums text-zinc-200">
                  {(trust * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-zinc-500">frame trust</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder="Actual reps you did"
                className="w-40 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              />
              <button
                onClick={logResult}
                disabled={actual === ""}
                className="rounded-lg bg-cyan-500/90 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400 disabled:opacity-40"
              >
                Log result
              </button>
              <button
                onClick={resetSet}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800"
              >
                Reset count
              </button>
            </div>
          </section>

          {/* ─── Metrics ─── */}
          <section className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                  Overall accuracy
                </h2>
                <span className="text-xs text-zinc-500">{overall.sets} sets logged</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Rep accuracy" value={pct(overall.repAccuracy)} highlight />
                <Metric label="Exact-set rate" value={pct(overall.exactRate)} />
                <Metric label="Mean abs error" value={num(overall.mae)} suffix=" reps" />
                <Metric label="Total reps" value={String(overall.totalActual)} />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                  By exercise
                </h2>
                {logs.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300">
                    Clear all
                  </button>
                )}
              </div>
              {perExercise.length === 0 ? (
                <p className="text-sm text-zinc-500">No data yet — log a set to begin.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-zinc-500">
                        <th className="pb-2 pr-3 font-medium">Exercise</th>
                        <th className="pb-2 pr-3 font-medium">Sets</th>
                        <th className="pb-2 pr-3 font-medium">Rep acc.</th>
                        <th className="pb-2 pr-3 font-medium">Exact</th>
                        <th className="pb-2 font-medium">MAE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perExercise.map((row) => (
                        <tr key={row.id} className="border-t border-zinc-800">
                          <td className="py-2 pr-3">{row.name}</td>
                          <td className="py-2 pr-3 tabular-nums">{row.m.sets}</td>
                          <td className="py-2 pr-3 tabular-nums">{pct(row.m.repAccuracy)}</td>
                          <td className="py-2 pr-3 tabular-nums">{pct(row.m.exactRate)}</td>
                          <td className="py-2 tabular-nums">{num(row.m.mae)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ─── Raw log ─── */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Logged sets
            </h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs"
            >
              <option value="all">All exercises</option>
              {perExercise.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </div>
          {filter !== "all" && (
            <p className="mb-3 text-xs text-zinc-500">
              Filtered: {filtered.sets} sets · rep acc {pct(filtered.repAccuracy)} · MAE{" "}
              {num(filtered.mae)}
            </p>
          )}
          {filteredLogs.length === 0 ? (
            <p className="text-sm text-zinc-500">No logged sets.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-500">
                    <th className="pb-2 pr-3 font-medium">When</th>
                    <th className="pb-2 pr-3 font-medium">Exercise</th>
                    <th className="pb-2 pr-3 font-medium">Detected</th>
                    <th className="pb-2 pr-3 font-medium">Actual</th>
                    <th className="pb-2 pr-3 font-medium">Δ</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((l) => {
                    const delta = l.detected - l.actual;
                    return (
                      <tr key={l.id} className="border-t border-zinc-800">
                        <td className="py-2 pr-3 text-zinc-400">
                          {new Date(l.ts).toLocaleTimeString()}
                        </td>
                        <td className="py-2 pr-3">{exercises[l.exercise]?.name ?? l.exercise}</td>
                        <td className="py-2 pr-3 tabular-nums">{l.detected}</td>
                        <td className="py-2 pr-3 tabular-nums">{l.actual}</td>
                        <td
                          className={`py-2 pr-3 tabular-nums ${
                            delta === 0 ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => deleteLog(l.id)}
                            className="text-xs text-zinc-500 hover:text-red-400"
                          >
                            delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <div className={`text-xl font-bold tabular-nums ${highlight ? "text-cyan-400" : "text-zinc-100"}`}>
        {value}
        {suffix && <span className="text-xs font-normal text-zinc-500">{suffix}</span>}
      </div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
