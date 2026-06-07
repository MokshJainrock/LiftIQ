import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getFoodLog, addFoodEntry, deleteFoodEntry } from "@/lib/neon/queries";
import type { FoodEntry } from "@/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const food = await getFoodLog(user.sub);
  return NextResponse.json({ food });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const entry = (await req.json()) as FoodEntry;
    await addFoodEntry(user.sub, entry);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[data/food] add", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await deleteFoodEntry(user.sub, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[data/food] delete", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
