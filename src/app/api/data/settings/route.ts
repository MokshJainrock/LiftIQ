import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSettings, saveSettings } from "@/lib/neon/queries";
import type { UserSettings } from "@/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await getSettings(user.sub);
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const settings = (await req.json()) as UserSettings;
    await saveSettings(user.sub, settings);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[data/settings]", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
