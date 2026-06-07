import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getStreakData, updateStreak } from "@/lib/neon/queries";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const streak = await getStreakData(user.sub);
  return NextResponse.json({ streak });
}

// POST = record a workout today and recompute the streak.
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const streak = await updateStreak(user.sub);
    return NextResponse.json({ streak });
  } catch (e) {
    console.error("[data/streak]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
