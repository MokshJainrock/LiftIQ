import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazy Neon client. We intentionally do NOT call neon() at module load — that
// throws when DATABASE_URL is missing, which would crash the production build
// during Next's "collect page data" step. Instead the connection is created on
// first query (request time), so the build succeeds and a missing env var only
// surfaces as a handled 500 at runtime.

let client: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set — Neon (primary DB) is unavailable.");
    client = neon(url);
  }
  return client;
}

// Minimal surface used across the app: parameterized .query(text, params).
export const sql = {
  query: (text: string, params?: unknown[]) => getClient().query(text, params),
};

export function isNeonConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}
