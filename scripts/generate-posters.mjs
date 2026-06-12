/**
 * Extract JPEG posters from exercise MP4s (for fast grid thumbnails).
 * Run: npm run generate:posters
 */

import { spawnSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ffmpegPath from "ffmpeg-static";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "../public/exercise-videos");

function posterFor(mp4Path) {
  const jpgPath = mp4Path.replace(/\.mp4$/i, ".jpg");
  if (existsSync(jpgPath)) return "skip";
  const r = spawnSync(
    ffmpegPath,
    ["-y", "-i", mp4Path, "-vframes", "1", "-q:v", "4", jpgPath],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(r.stderr?.slice(-200) || "ffmpeg failed");
  return "ok";
}

const mp4s = readdirSync(OUT_DIR).filter((f) => f.endsWith(".mp4"));
let ok = 0;
let skip = 0;
for (const f of mp4s) {
  const res = posterFor(join(OUT_DIR, f));
  if (res === "ok") ok++;
  else skip++;
}
console.log(`Posters — created ${ok}, skipped ${skip}, total ${mp4s.length}`);
