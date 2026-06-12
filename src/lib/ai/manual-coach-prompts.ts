// Prompts for AI coaching on manually logged (no-camera) workouts and for AI
// exercise suggestions. Strictly grounded in the numbers the client sends —
// the model is told to never invent data.

export interface ManualSetInput {
  reps: number;
  weight?: number; // lbs
}

export interface ManualHistoryEntry {
  daysAgo: number;
  volume: number; // lbs (or reps for bodyweight)
  topWeight?: number;
  totalReps: number;
}

export interface ManualCoachInput {
  exerciseName: string;
  sets: ManualSetInput[];
  ratingScore: number;
  unit: "lbs" | "kg";
  /** Most recent first, same exercise only. */
  history: ManualHistoryEntry[];
}

const KG = 2.2046226218;

function w(lbs: number, unit: "lbs" | "kg"): string {
  return unit === "kg" ? `${Math.round((lbs / KG) * 10) / 10} kg` : `${Math.round(lbs * 10) / 10} lbs`;
}

export function buildManualCoachPrompt(input: ManualCoachInput): string {
  const { exerciseName, sets, ratingScore, unit, history } = input;

  const setLines = sets
    .map((s, i) => `Set ${i + 1}: ${s.weight ? `${w(s.weight, unit)} x ` : ""}${s.reps} reps`)
    .join("; ");
  const volume = sets.reduce((n, s) => n + (s.weight ?? 1) * s.reps, 0);
  const isWeighted = sets.some((s) => (s.weight ?? 0) > 0);

  const historyLines =
    history.length > 0
      ? history
          .slice(0, 5)
          .map(
            (h) =>
              `${h.daysAgo === 0 ? "Today (earlier)" : `${h.daysAgo}d ago`}: ${
                h.topWeight ? `top ${w(h.topWeight, unit)}, ` : ""
              }${h.totalReps} reps, volume ${isWeighted ? w(h.volume, unit) : `${h.volume} reps`}`,
          )
          .join("\n")
      : "No previous sessions of this exercise — this is their baseline.";

  return `You are an experienced strength coach reviewing a gym log entry. The user logged this WITHOUT camera tracking, so you only know sets, reps, and load — never comment on movement form you cannot see.

Exercise: ${exerciseName}
Today's sets: ${setLines}
Today's total volume: ${isWeighted ? w(volume, unit) : `${sets.reduce((n, s) => n + s.reps, 0)} reps`}
App rating for this session: ${ratingScore}/100

Their recent history for ${exerciseName} (most recent first):
${historyLines}

Write a short coaching note (3-4 sentences, plain text, no markdown, no emoji) that:
1. Opens with an honest read of today's session vs their history (progress, plateau, or drop — use the actual numbers).
2. Gives ONE specific, actionable progression target for next session (exact weight in ${unit} or rep target, grounded in today's numbers — e.g. small +2.5 kg / +5 lbs jumps, or +1 rep).
3. Adds one programming tip relevant to ${exerciseName} (rest, rep range, set count, or exercise pairing).

Rules: use ${unit} for all weights; only reference numbers given above; no medical advice; under 90 words.`;
}

export interface SuggestInput {
  /** Recent training summary lines, e.g. "2d ago: Bench Press (chest) 3 sets". */
  recentSummary: string[];
  /** Muscle groups trained in the last 7 days with session counts. */
  muscleCounts: Record<string, number>;
  goal?: string;
  /** Allowed exercise names the model must choose from. */
  candidates: string[];
}

export function buildSuggestPrompt(input: SuggestInput): string {
  const trained =
    Object.entries(input.muscleCounts)
      .map(([m, c]) => `${m}: ${c}`)
      .join(", ") || "nothing in the last 7 days";

  const recent =
    input.recentSummary.length > 0 ? input.recentSummary.join("\n") : "No recent workouts.";

  return `You are a strength coach picking what a gym-goer should train today.

Recent workouts (most recent first):
${recent}

Muscle groups trained in the last 7 days (session counts): ${trained}
${input.goal ? `Their goal: ${input.goal}` : ""}

Choose EXACTLY 3 exercises from this list (names must match EXACTLY, including punctuation):
${input.candidates.join(", ")}

Prioritize: (1) muscle groups they have NOT trained recently (recovery + balance), (2) variety vs their recent exercises, (3) compound movements before isolation.

Respond with ONLY valid JSON, no markdown:
{"focus": "<one short sentence naming today's focus and why>", "suggestions": [{"name": "<exact name from list>", "reason": "<max 12 words, specific to their history>"}]}`;
}
