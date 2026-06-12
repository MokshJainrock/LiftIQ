/**
 * Replace GymGifsDB anatomical GIFs with ExerciseDB real-human demos.
 * Run: node scripts/migrate-to-exercisedb.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP_PATH = join(__dirname, "../src/lib/exercises/exercise-gif-map.json");
const API = "https://oss.exercisedb.dev/api/v1/exercises";

const MANUAL = {
  "bench-press": "barbell bench press",
  "dip-chest": "chest dip",
  "lat-pulldown": "cable pulldown",
  "lunge": "barbell lunge",
  "leg-extension": "lever leg extension",
  "stiff-leg-deadlift": "barbell stiff leg deadlift",
  "back-extension": "hyperextension",
  "v-up": "v-up",
  "swimming": "swimmer",
  "battle-ropes": "battling ropes",
  "kettlebell-clean-press": "kettlebell clean and press",
  "machine-row": "lever seated row",
  "machine-tricep-extension": "lever triceps extension",
  "dip-triceps": "triceps dip",
};

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function score(libName, gifName) {
  const ln = norm(libName);
  const gn = norm(gifName);
  if (gn.includes(ln) || ln.split(" ").every((w) => gn.includes(w))) return 100;
  const overlap = ln.split(" ").filter((w) => gn.includes(w)).length;
  return overlap * 20;
}

async function search(query) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(`${API}?name=${encodeURIComponent(query)}&limit=12`);
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      continue;
    }
    if (!res.ok) return [];
    return (await res.json()).data ?? [];
  }
  return [];
}

function parseLibrary() {
  const src = readFileSync(join(__dirname, "../src/lib/exercises/library.ts"), "utf8");
  const names = {};
  const re = /ex\("([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) {
    const id = m[1].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    names[id] = m[1];
  }
  return names;
}

async function main() {
  const map = JSON.parse(readFileSync(MAP_PATH, "utf8"));
  const names = parseLibrary();
  let swapped = 0;

  for (const [id, entry] of Object.entries(map)) {
    if (!entry?.gifUrl?.includes("jsdelivr")) continue;
    const query = MANUAL[id] ?? names[id] ?? id;
    const results = await search(query);
    let best = null;
    let bestScore = 0;
    for (const r of results) {
      const s = score(names[id] ?? id, r.name);
      if (s > bestScore) {
        bestScore = s;
        best = r;
      }
    }
    if (best && bestScore >= 40) {
      map[id] = {
        ...entry,
        gifUrl: best.gifUrl,
        sourceName: best.name,
        score: bestScore,
        instructions: best.instructions?.length ? best.instructions : entry.instructions,
        videoUrl: undefined,
        posterUrl: undefined,
      };
      swapped++;
      console.log(`  ✓ ${id} → ${best.name}`);
    } else {
      console.warn(`  – ${id}: no exercisedb match`);
    }
    await new Promise((r) => setTimeout(r, 220));
  }

  writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));
  console.log(`\nSwapped ${swapped} exercises to ExerciseDB human demos`);
}

main();
