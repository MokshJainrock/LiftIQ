/**
 * Shared form-score helpers for every camera exercise.
 */

/** Counted reps must never persist as 0 — that reads as "no credit" for a real movement. */
export const MIN_COMPLETED_REP_SCORE = 50;

export function clampFormScore(score: number): number {
  if (!Number.isFinite(score)) return MIN_COMPLETED_REP_SCORE;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Alias used by per-exercise configs. */
export const clampScore = clampFormScore;

export function finalizeCompletedRepScore(avg: number): number {
  if (!Number.isFinite(avg) || avg <= 0) return MIN_COMPLETED_REP_SCORE;
  return clampFormScore(avg);
}

/**
 * Visibility-weighted mean of per-frame scores for a completed rep.
 * Fast movements (jacks, burpees) often have near-zero trust on the
 * working frames — fall back to a plain mean, then never persist 0.
 */
export function averageInRepScores(scores: number[], trusts: number[]): number {
  if (scores.length === 0) return MIN_COMPLETED_REP_SCORE;

  let weighted = 0;
  let totalTrust = 0;
  const finite: number[] = [];
  for (let i = 0; i < scores.length; i++) {
    const s = scores[i];
    if (!Number.isFinite(s)) continue;
    finite.push(s);
    const t = trusts[i] ?? 0;
    if (t > 0) {
      weighted += s * t;
      totalTrust += t;
    }
  }

  if (finite.length === 0) return MIN_COMPLETED_REP_SCORE;
  const avg = totalTrust > 0.01 ? weighted / totalTrust : finite.reduce((a, b) => a + b, 0) / finite.length;
  return finalizeCompletedRepScore(avg);
}
