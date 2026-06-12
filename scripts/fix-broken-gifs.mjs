/**
 * Patches exercise-gif-map.json entries whose CDN URLs returned 404.
 * Run: node scripts/fix-broken-gifs.mjs && npm run generate:videos
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP_PATH = join(__dirname, "../src/lib/exercises/exercise-gif-map.json");
const GYM = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0";

/** exercise id → working gifUrl */
const FIXES = {
  "bench-press": `${GYM}/pectorals/barbell-bench-press.gif`,
  "dip-chest": `${GYM}/pectorals/chest-dip.gif`,
  "lat-pulldown": "https://static.exercisedb.dev/media/T2mxWqc.gif",
  "single-arm-lat-pulldown": "https://static.exercisedb.dev/media/T2mxWqc.gif",
  "machine-row": `${GYM}/upper-back/lever-seated-row.gif`,
  "band-pull-down": "https://static.exercisedb.dev/media/x69MAlq.gif",
  "machine-tricep-extension": `${GYM}/triceps/lever-triceps-extension.gif`,
  "lunge": `${GYM}/glutes/barbell-lunge.gif`,
  "leg-extension": `${GYM}/quads/lever-leg-extension.gif`,
  "stiff-leg-deadlift": `${GYM}/glutes/dumbbell-stiff-leg-deadlift.gif`,
  "back-extension": `${GYM}/spine/back-extension-on-exercise-ball.gif`,
  "v-up": `${GYM}/abs/band-v-up.gif`,
  "rowing-machine": "https://static.exercisedb.dev/media/a8VDgLw.gif",
  "swimming": `${GYM}/glutes/swimmer-kicks-v-2-male.gif`,
  "kettlebell-clean-press": `${GYM}/quads/barbell-clean-and-press.gif`,
  "battle-ropes": `${GYM}/delts/battling-ropes.gif`,
};

async function headOk(url) {
  const res = await fetch(url, { method: "HEAD" });
  return res.ok;
}

async function main() {
  const map = JSON.parse(readFileSync(MAP_PATH, "utf8"));
  let patched = 0;

  for (const [id, url] of Object.entries(FIXES)) {
    if (!map[id]) continue;
    const ok = await headOk(url);
    if (!ok) {
      console.warn(`  skip ${id}: URL still bad ${url}`);
      continue;
    }
    map[id] = { ...map[id], gifUrl: url, videoUrl: undefined };
    patched++;
    console.log(`  fixed ${id}`);
    await new Promise((r) => setTimeout(r, 150));
  }

  writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));
  console.log(`\nPatched ${patched} exercises — run npm run generate:videos next`);
}

main();
