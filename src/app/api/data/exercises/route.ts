import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getUserExercises, saveUserExercise, deleteUserExercise } from "@/lib/neon/queries";
import type { UserExercise } from "@/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const exercises = await getUserExercises(user.sub);
  return NextResponse.json({ exercises });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const exercise = (await req.json()) as UserExercise;
    await saveUserExercise(user.sub, exercise);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[data/exercises] save", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await deleteUserExercise(user.sub, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[data/exercises] delete", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
