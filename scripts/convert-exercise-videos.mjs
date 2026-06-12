/**
 * Converts exercise GIFs → smooth MP4 loops (~15s) in public/exercise-videos/.
 * Run: npm run generate:videos
 */

import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ffmpegPath from "ffmpeg-static";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP_PATH = join(__dirname, "../src/lib/exercises/exercise-gif-map.json");
const OUT_DIR = join(__dirname, "../public/exercise-videos");
const TARGET_SEC = 15;
const DOWNLOAD_DELAY_MS = 250;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function download(url, dest) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`download ${res.status}`);
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return;
  }
  throw new Error("download rate limited");
}

function convert(gifPath, mp4Path) {
  const args = [
    "-y",
    "-stream_loop",
    "-1",
    "-i",
    gifPath,
    "-t",
    String(TARGET_SEC),
    "-an",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-vf",
    "scale='min(720,iw)':-2,crop=trunc(iw*0.82/2)*2:trunc(ih*0.82/2)*2:(iw-iw*0.82)/2:(ih-ih*0.82)/2",
    mp4Path,
  ];
  const r = spawnSync(ffmpegPath, args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(r.stderr?.slice(-300) || "ffmpeg failed");
  }
}

async function main() {
  if (!ffmpegPath) throw new Error("ffmpeg-static binary not found");

  mkdirSync(OUT_DIR, { recursive: true });
  const map = JSON.parse(readFileSync(MAP_PATH, "utf8"));
  const tmpDir = join(OUT_DIR, ".tmp");
  mkdirSync(tmpDir, { recursive: true });

  const ids = Object.keys(map).filter((id) => map[id]?.gifUrl);
  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const entry = map[id];
    const mp4Name = `${id}.mp4`;
    const mp4Path = join(OUT_DIR, mp4Name);
    const videoUrl = `/exercise-videos/${mp4Name}`;
    const gifTmp = join(tmpDir, `${id}.gif`);

    process.stdout.write(`\r  ${i + 1}/${ids.length} ${id.slice(0, 36).padEnd(36)}`);

    if (existsSync(mp4Path) && entry.videoUrl === videoUrl) {
      skipped++;
      continue;
    }

    try {
      await download(entry.gifUrl, gifTmp);
      convert(gifTmp, mp4Path);
      map[id] = { ...entry, videoUrl };
      done++;
      try {
        unlinkSync(gifTmp);
      } catch {
        /* ignore */
      }
    } catch (e) {
      failed++;
      console.warn(`\n  ✗ ${id}: ${e.message}`);
    }

    await sleep(DOWNLOAD_DELAY_MS);
  }

  writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));
  console.log(`\n\nDone — created ${done}, skipped ${skipped}, failed ${failed}`);
  console.log(`Videos → ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
