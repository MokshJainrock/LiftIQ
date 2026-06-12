/**
 * Converts exercise GIFs or HD source MP4s → smooth loops (≤20s) in public/exercise-videos/.
 * Run: npm run generate:videos
 * Force re-encode: npm run generate:videos:force
 */

import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ffmpegPath from "ffmpeg-static";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP_PATH = join(__dirname, "../src/lib/exercises/exercise-gif-map.json");
const OUT_DIR = join(__dirname, "../public/exercise-videos");
const TARGET_SEC = 20;
const DOWNLOAD_DELAY_MS = 250;
const FORCE = process.argv.includes("--force");

/** Fit media in 16:9 without cropping — avoids the “zoomed in” look on wide cards. */
const VF =
  "scale='min(1280,iw)':-2:flags=lanczos,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x050508";

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

function posterFor(mp4Path) {
  const jpgPath = mp4Path.replace(/\.mp4$/i, ".jpg");
  spawnSync(
    ffmpegPath,
    ["-y", "-i", mp4Path, "-vframes", "1", "-q:v", "2", jpgPath],
    { encoding: "utf8" },
  );
}

function encodeToLoop(inputPath, mp4Path) {
  const args = [
    "-y",
    "-stream_loop",
    "-1",
    "-i",
    inputPath,
    "-t",
    String(TARGET_SEC),
    "-an",
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-vf",
    VF,
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

  const ids = Object.keys(map).filter((id) => map[id]?.gifUrl || map[id]?.sourceVideoUrl);
  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const entry = map[id];
    const mp4Name = `${id}.mp4`;
    const mp4Path = join(OUT_DIR, mp4Name);
    const jpgPath = mp4Path.replace(/\.mp4$/i, ".jpg");
    const videoUrl = `/exercise-videos/${mp4Name}`;
    const srcTmp = join(tmpDir, `${id}.src`);

    process.stdout.write(`\r  ${i + 1}/${ids.length} ${id.slice(0, 36).padEnd(36)}`);

    if (!FORCE && existsSync(mp4Path) && existsSync(jpgPath) && entry.videoUrl === videoUrl) {
      skipped++;
      continue;
    }

    try {
      if (entry.sourceVideoUrl) {
        await download(entry.sourceVideoUrl, `${srcTmp}.mp4`);
        encodeToLoop(`${srcTmp}.mp4`, mp4Path);
      } else if (entry.gifUrl) {
        await download(entry.gifUrl, `${srcTmp}.gif`);
        encodeToLoop(`${srcTmp}.gif`, mp4Path);
      } else {
        throw new Error("no gifUrl or sourceVideoUrl");
      }

      posterFor(mp4Path);
      map[id] = {
        ...entry,
        videoUrl,
        posterUrl: `/exercise-videos/${id}.jpg`,
      };
      done++;
      for (const ext of [".gif", ".mp4"]) {
        try {
          unlinkSync(`${srcTmp}${ext}`);
        } catch {
          /* ignore */
        }
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
