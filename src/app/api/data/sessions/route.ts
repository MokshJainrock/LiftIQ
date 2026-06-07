import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSessions, saveSession } from "@/lib/neon/queries";
import type { WorkoutSession } from "@/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await getSessions(user.sub);
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const session = (await req.json()) as WorkoutSession;
    await saveSession(user.sub, session);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[data/sessions]", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
