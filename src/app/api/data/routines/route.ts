import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getRoutines, saveRoutine, deleteRoutine } from "@/lib/neon/queries";
import type { WorkoutRoutine } from "@/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const routines = await getRoutines(user.sub);
  return NextResponse.json({ routines });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const routine = (await req.json()) as WorkoutRoutine;
    await saveRoutine(user.sub, routine);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[data/routines] save", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await deleteRoutine(user.sub, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[data/routines] delete", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
