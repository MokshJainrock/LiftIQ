import { NextRequest, NextResponse } from "next/server";
import { generateFormExplanations } from "@/lib/ai/explainer";
import { getFallbackExplanations } from "@/lib/ai/explainer-prompts";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import type { JointFeedback, JointStatus } from "@/types";

const VALID_STATUS: JointStatus[] = ["good", "moderate", "poor"];

export async function POST(req: NextRequest) {
  if (!rateLimit(`explain:${clientKey(req)}`, 20, 60_000)) {
    return NextResponse.json({ explanations: [], source: "fallback" }, { status: 429 });
  }

  let body: { exercise?: unknown; issues?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ explanations: [], source: "fallback" });
  }

  const exercise = typeof body.exercise === "string" ? body.exercise.slice(0, 64) : "";
  const issues: JointFeedback[] = Array.isArray(body.issues)
    ? body.issues
        .filter((i): i is { message: string; status?: string; joint?: string } => {
          if (!i || typeof i !== "object") return false;
          const o = i as Record<string, unknown>;
          return typeof o.message === "string" && o.message.length > 0;
        })
        .slice(0, 50)
        .map((i) => ({
          joint: typeof i.joint === "string" ? i.joint : "unknown",
          status: VALID_STATUS.includes(i.status as JointStatus) ? (i.status as JointStatus) : "moderate",
          message: i.message.slice(0, 160),
        }))
    : [];

  if (!exercise || issues.length === 0) {
    return NextResponse.json({ explanations: [], source: "fallback" });
  }

  try {
    const explanations = await generateFormExplanations(issues, exercise);
    return NextResponse.json({ explanations, source: "ai" });
  } catch {
    return NextResponse.json({
      explanations: getFallbackExplanations(issues, exercise),
      source: "fallback",
    });
  }
}
