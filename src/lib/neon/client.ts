import "server-only";
import { neon } from "@neondatabase/serverless";

// Single shared HTTP SQL client for Neon. Server-only — the connection
// string must never reach the browser.
const url = process.env.DATABASE_URL;
if (!url) {
  // Surfaced loudly during dev/build so a missing primary DB isn't silent.
  console.error("DATABASE_URL is not set — Neon (primary DB) is unavailable.");
}

export const sql = neon(url ?? "");

export function isNeonConfigured(): boolean {
  return !!url;
}
