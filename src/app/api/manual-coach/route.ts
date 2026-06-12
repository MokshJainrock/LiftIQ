import { NextRequest, NextResponse } from "next/server";
import { callOpenAI, isOpenAIAvailable } from "@/lib/ai/openai-client";
import {
  buildManualCoachPrompt,
  type ManualCoachInput,
  type ManualHistoryEntry,
  type ManualSetInput,
} from "@/lib/ai/manual-coach-prompts";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// AI coaching for manually logged sets. The client always has the
// deterministic rating to show, so this route never surfaces errors —
// it returns an empty feedback with a fallback tag instead.

function sanitize(body: Record<string, unknown>): ManualCoachInput | null {
  const exerciseName =
    typeof body.exerciseName === "string" ? body.exerciseName.slice(0, 64) : "";
  if (!exerciseName) return null;

  const sets: ManualSetInput[] = Array.isArray(body.sets)
    ? body.sets
        .filter(
          (s): s is { reps: number; weight?: number } =>
            !!s && typeof (s as Record<string, unknown>).reps === "number",
        )
        .map((s) => ({
          reps: Math.max(0, Math.min(500, Math.round(s.reps))),
          weight:
            typeof s.weight === "number" && Number.isFinite(s.weight) && s.weight > 0
              ? Math.min(2000, s.weight)
              : undefined,
        }))
        .slice(0, 20)
    : [];
  if (sets.length === 0) return null;

  const history: ManualHistoryEntry[] = Array.isArray(body.history)
    ? body.history
        .filter(
          (h): h is ManualHistoryEntry =>
            !!h &&
            typeof (h as Record<string, unknown>).daysAgo === "number" &&
            typeof (h as Record<string, unknown>).volume === "number" &&
            typeof (h as Record<string, unknown>).totalReps === "number",
        )
        .map((h) => ({
          daysAgo: Math.max(0, Math.round(h.daysAgo)),
          volume: Math.max(0, Math.round(h.volume)),
          topWeight:
            typeof h.topWeight === "number" && h.topWeight > 0 ? h.topWeight : undefined,
          totalReps: Math.max(0, Math.round(h.totalReps)),
        }))
        .slice(0, 5)
    : [];

  return {
    exerciseName,
    sets,
    ratingScore:
      typeof body.ratingScore === "number"
        ? Math.max(0, Math.min(100, Math.round(body.ratingScore)))
        : 0,
    unit: body.unit === "kg" ? "kg" : "lbs",
    history,
  };
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`manual-coach:${clientKey(req)}`, 20, 60_000)) {
    return NextResponse.json({ feedback: "", source: "fallback" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ feedback: "", source: "fallback" });
  }

  const input = sanitize(body);
  if (!input || !isOpenAIAvailable()) {
    return NextResponse.json({ feedback: "", source: "fallback" });
  }

  try {
    const res = await callOpenAI({
      prompt: buildManualCoachPrompt(input),
      maxTokens: 220,
      temperature: 0.6,
    });
    if (!res.ok || !res.text) {
      return NextResponse.json({ feedback: "", source: "fallback" });
    }
    return NextResponse.json({ feedback: res.text.trim(), source: "ai" });
  } catch {
    return NextResponse.json({ feedback: "", source: "fallback" });
  }
}
