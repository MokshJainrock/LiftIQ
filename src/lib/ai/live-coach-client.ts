"use client";

/** Debounced live AI coaching — keeps rule-based cues instant, enriches async. */

const DEBOUNCE_MS = 2800;
const MIN_INTERVAL_MS = 4500;

let timer: ReturnType<typeof setTimeout> | null = null;
let lastFetchAt = 0;
let lastKey = "";
let inFlight: AbortController | null = null;

export type LiveCoachCallback = (cue: string) => void;

export function requestLiveCoachCue(
  key: string,
  payload: {
    exerciseName: string;
    phase: string;
    repCount: number;
    score: number | null;
    confidenceTier: "high" | "medium" | "low";
    issues: string[];
    ruleCues: string[];
  },
  onCue: LiveCoachCallback,
): void {
  if (key === lastKey && Date.now() - lastFetchAt < MIN_INTERVAL_MS) return;

  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    if (Date.now() - lastFetchAt < MIN_INTERVAL_MS && key === lastKey) return;
    lastKey = key;
    lastFetchAt = Date.now();

    inFlight?.abort();
    inFlight = new AbortController();

    try {
      const res = await fetch("/api/live-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: inFlight.signal,
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { cue?: string; source?: string };
      if (data.cue && data.source === "ai") onCue(data.cue);
    } catch {
      /* fallback: rule cues already visible */
    }
  }, DEBOUNCE_MS);
}

export function resetLiveCoachClient(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  inFlight?.abort();
  inFlight = null;
  lastKey = "";
}
