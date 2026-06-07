// Runs neon-schema.sql against the Neon database in DATABASE_URL.
// Usage: node scripts/migrate-neon.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Minimal .env.local loader (no extra deps).
function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    /* env file optional if vars already set */
  }
}

// Split SQL into statements. Our schema has no functions/DO blocks with
// inner semicolons, so a naive split on ";" is safe here. Full-line comments
// are stripped first so statements preceded by comment blocks aren't dropped.
function splitStatements(sql) {
  const withoutComments = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = neon(url);
  const schema = readFileSync(join(root, "neon-schema.sql"), "utf8");
  const statements = splitStatements(schema);

  console.log(`Running ${statements.length} statements against Neon…`);
  for (const stmt of statements) {
    const label = stmt.split("\n")[0].slice(0, 70);
    try {
      await sql.query(stmt);
      console.log("  ✓", label);
    } catch (e) {
      console.error("  ✗", label, "\n    ", e.message);
      process.exit(1);
    }
  }
  console.log("Neon schema is up to date.");
}

main();
