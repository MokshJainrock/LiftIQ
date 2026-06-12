import { NextRequest, NextResponse } from "next/server";
import { callOpenAI, isOpenAIAvailable } from "@/lib/ai/openai-client";
import { buildCoachPrompt, type CoachFeedbackInput } from "@/lib/ai/coach-prompts";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// The client renders its rule-based summary instantly and swaps in this
// response when it arrives, so this route always answers 200 with a source
// tag instead of surfacing errors.

function sanitize(body: Record<string, unknown>): CoachFeedbackInput | null {
  const exercise = typeof body.exercise === "string" ? body.exercise.slice(0, 64) : "";
  if (!exercise) return null;

  const repScores = Array.isArray(body.repScores)
    ? body.repScores
        .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
        .map((n) => Math.max(0, Math.min(100, Math.round(n))))
        .slice(0, 200)
    : [];

  const mistakes = Array.isArray(body.mistakes)
    ? body.mistakes
        .filter(
          (m): m is { issue: string; count: number } =>
            !!m && typeof (m as Record<string, unknown>).issue === "string" &&
            typeof (m as Record<string, unknown>).count === "number",
        )
        .map((m) => ({ issue: m.issue.slice(0, 120), count: Math.round(m.count) }))
        .slice(0, 10)
    : [];

  return {
    exercise,
    repScores,
    avgScore: typeof body.avgScore === "number" ? Math.round(body.avgScore) : 0,
    durationSec: typeof body.durationSec === "number" ? Math.max(0, Math.round(body.durationSec)) : 0,
    weight: typeof body.weight === "number" ? body.weight : undefined,
    caloriesBurned: typeof body.caloriesBurned === "number" ? body.caloriesBurned : undefined,
    mistakes,
    bestRepIndex: typeof body.bestRepIndex === "number" ? body.bestRepIndex : undefined,
    bestRepScore: typeof body.bestRepScore === "number" ? body.bestRepScore : undefined,
  };
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`coach:${clientKey(req)}`, 20, 60_000)) {
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
      prompt: buildCoachPrompt(input),
      maxTokens: 300,
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
