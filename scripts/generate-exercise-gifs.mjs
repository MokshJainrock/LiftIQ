/**
 * Maps LiftIQ library exercises → real human demo GIFs (ExerciseGymGifsDB, CDN).
 * Run: node scripts/generate-exercise-gifs.mjs
 */

import { writeFileSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GIF_DB =
  "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/en/exercises.json";

const EQUIP_ALIASES = {
  barbell: ["barbell", "ez barbell", "ez-barbell", "olympic barbell"],
  dumbbell: ["dumbbell"],
  machine: ["lever", "smith", "machine", "sled"],
  cable: ["cable"],
  bodyweight: ["bodyweight", "body weight"],
  kettlebell: ["kettlebell"],
  band: ["band", "resistance band"],
  cardio: ["cardio", "stationary", "treadmill", "elliptical"],
};

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function words(s) {
  return norm(s).split(" ").filter(Boolean);
}

function equipMatches(libEquip, gifEquip) {
  const g = norm(gifEquip);
  const aliases = EQUIP_ALIASES[libEquip] ?? [libEquip];
  return aliases.some((a) => g.includes(a) || a.includes(g));
}

function scoreMatch(libName, libEquip, libMuscle, gif) {
  const ln = norm(libName);
  const gn = norm(gif.name);
  if (ln === gn) return 1000;
  if (gn === ln) return 1000;

  // Prefer exact equipment prefix: "Barbell Bench Press"
  const equipPrefixes = EQUIP_ALIASES[libEquip] ?? [libEquip];
  for (const p of equipPrefixes) {
    const prefixed = `${p} ${ln}`;
    if (gn === prefixed) return 950;
    if (gn.startsWith(prefixed)) return 900;
  }

  const lw = words(libName);
  const gw = words(gif.name);
  const allLibInGif = lw.every((w) => gw.includes(w));
  if (allLibInGif && equipMatches(libEquip, gif.equipment)) return 800 + lw.length * 10;
  if (allLibInGif) return 600 + lw.length * 5;

  // Partial: gif name contains library name
  if (gn.includes(ln) && equipMatches(libEquip, gif.equipment)) return 500;
  if (gn.includes(ln)) return 400;

  // Word overlap
  const overlap = lw.filter((w) => gw.includes(w)).length;
  if (overlap >= Math.ceil(lw.length * 0.7) && equipMatches(libEquip, gif.equipment)) {
    return 300 + overlap * 20;
  }
  if (overlap >= Math.ceil(lw.length * 0.7)) return 200 + overlap * 10;

  return 0;
}

function parseLibrary() {
  const src = readFileSync(join(__dirname, "../src/lib/exercises/library.ts"), "utf8");
  const exercises = [];
  const re = /ex\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    exercises.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name,
      muscle: m[2],
      equipment: m[3],
    });
  }
  return exercises;
}

async function main() {
  console.log("Fetching GIF database…");
  const res = await fetch(GIF_DB);
  const { exercises: gifs } = await res.json();
  const library = parseLibrary();

  const map = {};
  let matched = 0;

  for (const lib of library) {
    let best = null;
    let bestScore = 0;
    for (const gif of gifs) {
      const s = scoreMatch(lib.name, lib.equipment, lib.muscle, gif);
      if (s > bestScore) {
        bestScore = s;
        best = gif;
      }
    }
    if (best && bestScore >= 200) {
      map[lib.id] = {
        gifUrl: best.gifUrl,
        sourceName: best.name,
        score: bestScore,
      };
      matched++;
    } else {
      map[lib.id] = null;
      console.warn(`  No match: ${lib.name} (${lib.equipment})`);
    }
  }

  const out = join(__dirname, "../src/lib/exercises/exercise-gif-map.json");
  writeFileSync(out, JSON.stringify(map, null, 2));
  console.log(`\nWrote ${out}`);
  console.log(`Matched ${matched}/${library.length} exercises`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
