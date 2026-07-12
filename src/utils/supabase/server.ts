import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async (cookieStore?: Awaited<ReturnType<typeof cookies>>) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Supabase is an optional OAuth fallback. When it isn't configured we return
  // null instead of throwing so the build/prerender can never crash — callers
  // handle the null and degrade gracefully.
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  const store = cookieStore ?? await cookies();
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware handles refresh
          }
        },
      },
    },
  );
};
