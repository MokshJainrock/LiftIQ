import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getRecordings, saveRecordingMeta, deleteRecordingMeta } from "@/lib/neon/queries";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const recordings = await getRecordings(user.sub);
  return NextResponse.json({ recordings });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const meta = await req.json();
    await saveRecordingMeta(user.sub, {
      id: meta.id,
      sessionId: meta.sessionId ?? "",
      exercise: meta.exercise,
      exerciseName: meta.exerciseName,
      reps: meta.reps ?? 0,
      score: meta.score ?? 0,
      duration: meta.duration ?? 0,
      size: meta.size ?? 0,
      storagePath: meta.storagePath ?? null,
      createdAt: meta.createdAt ?? Date.now(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[data/recordings] save", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await deleteRecordingMeta(user.sub, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[data/recordings] delete", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
