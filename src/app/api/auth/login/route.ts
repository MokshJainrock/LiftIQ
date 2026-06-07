import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getUserByEmail,
  createUser,
  updateUserPassword,
  linkSupabaseId,
} from "@/lib/neon/users";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { importSupabaseData } from "@/lib/auth/import-from-supabase";

export async function POST(req: NextRequest) {
  let email = "";
  let password = "";
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim() : "";
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    // 1) Primary: authenticate against Neon.
    const neonUser = await getUserByEmail(email);
    if (neonUser && (await verifyPassword(password, neonUser.passwordHash))) {
      await createSession({ sub: neonUser.id, email: neonUser.email });
      return NextResponse.json({ ok: true, source: "neon" });
    }

    // 2) Fallback: authenticate against Supabase (the backup). On success we
    //    migrate the user into Neon so future logins are Neon-native.
    const fallback = await trySupabaseLogin(email, password);
    if (fallback.ok) {
      const passwordHash = await hashPassword(password);

      if (neonUser) {
        // Neon account exists but the hash was stale (e.g. password changed in
        // Supabase) — refresh it and sign in.
        await updateUserPassword(neonUser.id, passwordHash);
        if (fallback.userId) await linkSupabaseId(neonUser.id, fallback.userId);
        await createSession({ sub: neonUser.id, email: neonUser.email });
        return NextResponse.json({ ok: true, source: "supabase-relink" });
      }

      // Create the Neon account and import their Supabase data.
      const created = await createUser({
        email,
        passwordHash,
        fullName: fallback.fullName ?? "",
        supabaseId: fallback.userId,
      });
      if (fallback.supabase && fallback.userId) {
        try {
          await importSupabaseData(fallback.supabase, fallback.userId, created.id);
        } catch (e) {
          console.warn("[login] data import failed:", e);
        }
      }
      await createSession({ sub: created.id, email: created.email });
      return NextResponse.json({ ok: true, source: "supabase-migrated", migrated: true });
    }

    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  } catch (e) {
    console.error("[login]", e);
    return NextResponse.json({ error: "Sign in failed. Try again." }, { status: 500 });
  }
}

interface FallbackResult {
  ok: boolean;
  userId?: string;
  fullName?: string;
  supabase?: SupabaseClient | null;
}

async function trySupabaseLogin(email: string, password: string): Promise<FallbackResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { ok: false };
  try {
    const supabase = createSupabaseClient(url, key);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { ok: false };
    return {
      ok: true,
      userId: data.user.id,
      fullName: (data.user.user_metadata?.full_name as string) ?? "",
      supabase,
    };
  } catch (e) {
    console.warn("[login] supabase fallback unavailable:", e);
    return { ok: false };
  }
}
