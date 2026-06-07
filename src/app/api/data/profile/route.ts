import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProfile, saveProfile } from "@/lib/neon/queries";
import type { UserProfile } from "@/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile(user.sub);
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const profile = (await req.json()) as UserProfile;
    await saveProfile(user.sub, profile);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[data/profile]", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
