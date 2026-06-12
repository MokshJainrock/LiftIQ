import { NextRequest, NextResponse } from "next/server";
import { callOpenAI, isOpenAIAvailable } from "@/lib/ai/openai-client";
import { buildSuggestPrompt } from "@/lib/ai/manual-coach-prompts";
import { EXERCISE_LIBRARY } from "@/lib/exercises/library";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// AI "what should I train today" suggestions. Returns up to 3 exercises from
// the app's own library (names validated server-side so the client can always
// resolve them) plus a one-line focus.

interface Suggestion {
  name: string;
  reason: string;
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`suggest:${clientKey(req)}`, 10, 60_000)) {
    return NextResponse.json({ focus: "", suggestions: [], source: "fallback" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ focus: "", suggestions: [], source: "fallback" });
  }

  if (!isOpenAIAvailable()) {
    return NextResponse.json({ focus: "", suggestions: [], source: "fallback" });
  }

  const recentSummary = Array.isArray(body.recentSummary)
    ? body.recentSummary.filter((s): s is string => typeof s === "string").map((s) => s.slice(0, 120)).slice(0, 15)
    : [];
  const muscleCounts =
    body.muscleCounts && typeof body.muscleCounts === "object"
      ? Object.fromEntries(
          Object.entries(body.muscleCounts as Record<string, unknown>)
            .filter(([, v]) => typeof v === "number")
            .slice(0, 20),
        ) as Record<string, number>
      : {};
  const goal = typeof body.goal === "string" ? body.goal.slice(0, 60) : undefined;

  const candidates = EXERCISE_LIBRARY.map((e) => e.name);
  const validNames = new Set(candidates.map((n) => n.toLowerCase()));

  try {
    const res = await callOpenAI({
      prompt: buildSuggestPrompt({ recentSummary, muscleCounts, goal, candidates }),
      maxTokens: 250,
      temperature: 0.7,
      jsonMode: true,
    });
    if (!res.ok || !res.text) {
      return NextResponse.json({ focus: "", suggestions: [], source: "fallback" });
    }

    const parsed = JSON.parse(res.text) as { focus?: string; suggestions?: Suggestion[] };
    const suggestions = (parsed.suggestions ?? [])
      .filter(
        (s): s is Suggestion =>
          !!s && typeof s.name === "string" && validNames.has(s.name.toLowerCase()),
      )
      .map((s) => ({
        // Normalize to the library's exact casing so the client lookup succeeds.
        name: candidates.find((c) => c.toLowerCase() === s.name.toLowerCase()) ?? s.name,
        reason: typeof s.reason === "string" ? s.reason.slice(0, 100) : "",
      }))
      .slice(0, 3);

    if (suggestions.length === 0) {
      return NextResponse.json({ focus: "", suggestions: [], source: "fallback" });
    }
    return NextResponse.json({
      focus: typeof parsed.focus === "string" ? parsed.focus.slice(0, 160) : "",
      suggestions,
      source: "ai",
    });
  } catch {
    return NextResponse.json({ focus: "", suggestions: [], source: "fallback" });
  }
}
