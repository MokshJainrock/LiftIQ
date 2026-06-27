import { NextRequest, NextResponse } from "next/server";
import { callOpenAI, isOpenAIAvailable } from "@/lib/ai/openai-client";
import { buildLiveCoachPrompt, type LiveCoachInput } from "@/lib/ai/live-coach-prompts";
import { rateLimit, clientKey } from "@/lib/rate-limit";

function sanitize(body: Record<string, unknown>): LiveCoachInput | null {
  const exerciseName =
    typeof body.exerciseName === "string" ? body.exerciseName.slice(0, 64) : "";
  if (!exerciseName) return null;

  const tier = body.confidenceTier;
  const confidenceTier =
    tier === "high" || tier === "medium" || tier === "low" ? tier : "medium";

  const issues = Array.isArray(body.issues)
    ? body.issues.filter((x): x is string => typeof x === "string").slice(0, 6)
    : [];
  const ruleCues = Array.isArray(body.ruleCues)
    ? body.ruleCues.filter((x): x is string => typeof x === "string").slice(0, 4)
    : [];

  return {
    exerciseName,
    phase: typeof body.phase === "string" ? body.phase.slice(0, 32) : "active",
    repCount:
      typeof body.repCount === "number" ? Math.max(0, Math.min(500, Math.round(body.repCount))) : 0,
    score:
      typeof body.score === "number" && Number.isFinite(body.score)
        ? Math.max(0, Math.min(100, Math.round(body.score)))
        : null,
    confidenceTier,
    issues,
    ruleCues,
  };
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`live-coach:${clientKey(req)}`, 30, 60_000)) {
    return NextResponse.json({ cue: "", source: "fallback" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ cue: "", source: "fallback" });
  }

  const input = sanitize(body);
  if (!input || !isOpenAIAvailable()) {
    return NextResponse.json({ cue: "", source: "fallback" });
  }

  try {
    const res = await callOpenAI({
      prompt: buildLiveCoachPrompt(input),
      maxTokens: 48,
      temperature: 0.55,
    });
    if (!res.ok || !res.text) {
      return NextResponse.json({ cue: "", source: "fallback" });
    }
    const cue = res.text.replace(/^["']|["']$/g, "").trim();
    return NextResponse.json({ cue, source: "ai" });
  } catch {
    return NextResponse.json({ cue: "", source: "fallback" });
  }
}
