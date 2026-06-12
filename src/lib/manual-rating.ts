// Rates a manually logged (no-camera) workout against the user's own history
// for the same exercise. Deterministic on purpose: ratings stay explainable and
// never invent claims the data can't back up.

import { LoggedSet, WorkoutSession } from "@/types";

export interface ManualRating {
  /** 0-100 session rating, comparable to camera session scores. */
  score: number;
  /** One-line verdict shown next to the score. */
  summary: string;
  /** Wins worth celebrating (PRs, progressive overload, ...). */
  highlights: string[];
  /** Concrete suggestions for next session. */
  tips: string[];
}

/** Epley estimated 1RM. For bodyweight sets (no load) this is not used. */
function e1rm(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

function setVolume(s: LoggedSet): number {
  // Bodyweight sets count reps only, so volume stays comparable across
  // sessions of the same (unweighted) exercise.
  return s.weight && s.weight > 0 ? s.weight * s.reps : s.reps;
}

export function rateManualWorkout(
  exerciseKey: string,
  sets: LoggedSet[],
  history: WorkoutSession[],
): ManualRating {
  const highlights: string[] = [];
  const tips: string[] = [];

  const past = history.filter((h) => h.exercise === exerciseKey);
  const isWeighted = sets.some((s) => (s.weight ?? 0) > 0);

  const totalReps = sets.reduce((n, s) => n + s.reps, 0);
  const volume = sets.reduce((n, s) => n + setVolume(s), 0);
  const topWeight = Math.max(0, ...sets.map((s) => s.weight ?? 0));
  const bestE1rm = isWeighted
    ? Math.max(...sets.filter((s) => (s.weight ?? 0) > 0).map((s) => e1rm(s.weight!, s.reps)))
    : 0;

  // Past bests for the same exercise (manual sessions store sets; camera
  // sessions fall back to session weight x rep count).
  let pastMaxWeight = 0;
  let pastBestVolume = 0;
  let pastBestE1rm = 0;
  let lastVolume = 0;
  for (const h of past) {
    const hSets: LoggedSet[] =
      h.sets ?? (h.weight ? [{ reps: h.reps.length, weight: h.weight }] : [{ reps: h.reps.length }]);
    const hVolume = hSets.reduce((n, s) => n + setVolume(s), 0);
    pastBestVolume = Math.max(pastBestVolume, hVolume);
    lastVolume = hVolume; // history is chronological; last assignment = most recent
    for (const s of hSets) {
      if (s.weight) {
        pastMaxWeight = Math.max(pastMaxWeight, s.weight);
        pastBestE1rm = Math.max(pastBestE1rm, e1rm(s.weight, s.reps));
      }
    }
  }

  let score = 62;

  // ── Progress vs own history ──────────────────────────────────
  if (past.length === 0) {
    highlights.push("First logged session for this exercise — baseline set.");
  } else {
    if (isWeighted && topWeight > pastMaxWeight && pastMaxWeight > 0) {
      score += 10;
      highlights.push(`New weight PR: ${topWeight} lbs (previous best ${pastMaxWeight} lbs).`);
    }
    if (isWeighted && bestE1rm > pastBestE1rm && pastBestE1rm > 0) {
      score += 8;
      highlights.push(`Estimated 1RM up to ~${Math.round(bestE1rm)} lbs — strength is climbing.`);
    }
    if (volume > pastBestVolume) {
      score += 8;
      highlights.push(
        isWeighted
          ? `Biggest session yet: ${Math.round(volume).toLocaleString()} lbs of total volume.`
          : `Biggest session yet: ${totalReps} total reps.`,
      );
    } else if (lastVolume > 0 && volume >= lastVolume) {
      score += 6;
      highlights.push("Matched or beat your last session — progressive overload on track.");
    } else if (lastVolume > 0 && volume < lastVolume * 0.7) {
      score -= 4;
      tips.push("Volume dropped 30%+ vs last time — short on time, or under-recovered?");
    }
  }

  // ── Session structure ────────────────────────────────────────
  if (sets.length >= 3 && sets.length <= 6) {
    score += 6;
  } else if (sets.length < 3) {
    tips.push("1-2 sets is a light dose — aim for 3-5 working sets for steady progress.");
  }

  const repsInRange = sets.filter((s) => s.reps >= 5 && s.reps <= 15).length;
  if (sets.length > 0 && repsInRange === sets.length) {
    score += 6;
  } else if (sets.some((s) => s.reps > 20) && isWeighted) {
    tips.push("Sets over 20 reps: the load is likely too light — add weight, stay in 6-15 reps.");
  } else if (sets.every((s) => s.reps < 5) && isWeighted) {
    tips.push("All sets under 5 reps — heavy strength work. Make sure warm-up sets come first.");
  }

  // Fatigue drop-off across sets of equal weight
  if (sets.length >= 3) {
    const first = sets[0].reps;
    const last = sets[sets.length - 1].reps;
    if (first > 0 && last >= first * 0.6) {
      score += 4;
    } else if (first > 0 && last < first * 0.5) {
      tips.push("Reps fell 50%+ by the last set — try slightly longer rest or a small load drop.");
    }
  }

  score = Math.max(35, Math.min(100, Math.round(score)));

  const summary =
    score >= 90
      ? "Outstanding session — clear progress on the books."
      : score >= 78
        ? "Solid, productive session."
        : score >= 65
          ? "Decent work — a few tweaks will move the needle."
          : "Logged. Use the tips below to get more out of the next one.";

  if (tips.length === 0) {
    tips.push(
      isWeighted
        ? `Next time, try +5 lbs or +1 rep on your top set of ${topWeight} lbs.`
        : "Next time, add 1-2 reps per set or slow the tempo to keep progressing.",
    );
  }

  return { score, summary, highlights, tips };
}
