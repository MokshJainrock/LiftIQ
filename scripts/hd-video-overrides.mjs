/**
 * Optional HD MP4 sources (960×540+) from cdn.exercisedb.dev when publicly available.
 * Run: node scripts/hd-video-overrides.mjs && npm run generate:videos:force
 *
 * For full HD coverage, set EXERCISEDB_RAPIDAPI_KEY and run fetch-hd-from-api.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const MAP_PATH = join(dirname(fileURLToPath(import.meta.url)), "../src/lib/exercises/exercise-gif-map.json");
const CDN = "https://cdn.exercisedb.dev/videos";

/** liftiq id → public CDN MP4 (no API key required) */
const HD_VIDEOS = {
  "bench-press": `${CDN}/Trn4QDW/41n2hxnFMotsXTj3__Barbell-Bench-Press_Chest2_.mp4`,
};

async function headOk(url) {
  const res = await fetch(url, { method: "HEAD" });
  return res.ok;
}

async function main() {
  const map = JSON.parse(readFileSync(MAP_PATH, "utf8"));
  let applied = 0;

  for (const [id, url] of Object.entries(HD_VIDEOS)) {
    if (!map[id]) continue;
    if (!(await headOk(url))) {
      console.warn(`  skip ${id}: URL unavailable`);
      continue;
    }
    map[id] = { ...map[id], sourceVideoUrl: url, videoUrl: undefined, posterUrl: undefined };
    applied++;
    console.log(`  HD ${id}`);
  }

  writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));
  console.log(`\nApplied ${applied} HD video overrides`);
}

main();
