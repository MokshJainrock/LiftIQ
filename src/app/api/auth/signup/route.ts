import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getUserByEmail, createUser } from "@/lib/neon/users";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  let email = "";
  let password = "";
  let fullName = "";
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim() : "";
    password = typeof body?.password === "string" ? body.password : "";
    fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, passwordHash, fullName });

    // Best-effort mirror to Supabase so the backup has the account too.
    void mirrorSignupToSupabase(email, password, fullName);

    await createSession({ sub: user.id, email: user.email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[signup]", e);
    return NextResponse.json({ error: "Could not create account. Try again." }, { status: 500 });
  }
}

async function mirrorSignupToSupabase(email: string, password: string, fullName: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return;
  try {
    const supabase = createSupabaseClient(url, key);
    await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  } catch (e) {
    console.warn("[signup] supabase mirror failed:", e);
  }
}
