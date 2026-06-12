/**
 * Maps LiftIQ library exercises → real human demo GIFs (ExerciseDB primary).
 * Run: npm run generate:gifs
 */

import { writeFileSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXERCISEDB = "https://oss.exercisedb.dev/api/v1/exercises";
const GIF_DB_FALLBACK =
  "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/en/exercises.json";

const EQUIP_ALIASES = {
  barbell: ["barbell", "ez barbell", "ez-barbell", "olympic barbell", "bar"],
  dumbbell: ["dumbbell", "db"],
  machine: ["lever", "smith", "machine", "sled", "leverage"],
  cable: ["cable"],
  bodyweight: ["bodyweight", "body weight", "body-weight"],
  kettlebell: ["kettlebell", "kb"],
  band: ["band", "resistance band", "resistance-band"],
  cardio: ["cardio", "stationary", "treadmill", "elliptical", "assault", "bike", "rower"],
};

const MANUAL_SEARCH = {
  "pec-deck": "pec deck",
  "low-to-high-cable-fly": "low cable fly",
  "face-pull": "face pull",
  "rear-delt-fly": "rear delt",
  "machine-shoulder-press": "machine shoulder press",
  "landmine-press": "landmine press",
  "plate-front-raise": "front raise",
  "farmer-walk": "farmer walk",
  "dead-hang": "dead hang",
  "bulgarian-split-squat": "bulgarian split squat",
  "reverse-lunge": "reverse lunge",
  "nordic-curl": "nordic curl",
  "jumping-jack": "jumping jack",
  "rowing-machine": "rowing machine",
  "treadmill-run": "treadmill",
  "battle-ropes": "battle rope",
  "band-pull-apart": "band pull apart",
  "cable-woodchopper": "wood chop",
  "ab-wheel-rollout": "ab wheel",
  "donkey-kick": "donkey kick",
  "hip-abduction": "hip abduction",
  "chest-supported-row": "chest supported row",
  "machine-row": "machine row",
  "seal-row": "seal row",
  "meadows-row": "meadows row",
  "single-arm-lat-pulldown": "lat pulldown",
  "machine-incline-press": "incline press machine",
  "banded-chest-press": "band chest press",
};

const GYM = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0";

const HARDCODED_GIFS = {
  "rowing-machine": {
    gifUrl: `${GYM}/upper-back/lever-seated-row.gif`,
    sourceName: "Lever Seated Row",
    score: 90,
  },
  "assault-bike": {
    gifUrl: "https://static.exercisedb.dev/media/a8VDgLw.gif",
    sourceName: "stationary bike walk",
    score: 90,
  },
  "stair-climber": {
    gifUrl: "https://static.exercisedb.dev/media/3eGE2JC.gif",
    sourceName: "walking on stepmill",
    score: 90,
  },
  "cycling": {
    gifUrl: "https://static.exercisedb.dev/media/a8VDgLw.gif",
    sourceName: "stationary bike walk",
    score: 90,
  },
  "swimming": {
    gifUrl: `${GYM}/glutes/swimmer-kicks-v-2-male.gif`,
    sourceName: "Swimmer Kicks",
    score: 90,
  },
  "incline-walk": {
    gifUrl: "https://static.exercisedb.dev/media/3eGE2JC.gif",
    sourceName: "walking on stepmill",
    score: 90,
  },
  "man-maker": {
    gifUrl: "https://static.exercisedb.dev/media/qPEzJjA.gif",
    sourceName: "burpee",
    score: 90,
  },
  "battle-ropes": {
    gifUrl: `${GYM}/delts/battling-ropes.gif`,
    sourceName: "Battling Ropes",
    score: 90,
  },
};

const MUSCLE_TO_GIF = {
  chest: "pectorals",
  back: "lats",
  shoulders: "delts",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearms",
  quads: "quads",
  hamstrings: "hamstrings",
  glutes: "glutes",
  calves: "calves",
  core: "abs",
  cardio: "cardio",
  "full-body": "full body",
};

const MUSCLE_TO_BODY = {
  chest: "chest",
  back: "back",
  shoulders: "shoulders",
  biceps: "upper arms",
  triceps: "upper arms",
  forearms: "lower arms",
  quads: "upper legs",
  hamstrings: "upper legs",
  glutes: "upper legs",
  calves: "lower legs",
  core: "waist",
  cardio: "cardio",
  "full-body": "full body",
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

function scoreMatch(libName, libEquip, gif) {
  const ln = norm(libName);
  const gn = norm(gif.name);

  if (ln === gn) return 1000;

  const equipPrefixes = EQUIP_ALIASES[libEquip] ?? [libEquip];
  for (const p of equipPrefixes) {
    const prefixed = `${p} ${ln}`;
    if (gn === prefixed) return 950;
    if (gn.startsWith(`${p} `) && gn.includes(ln)) return 900;
  }

  const lw = words(libName);
  const gw = words(gif.name);
  const allLibInGif = lw.length > 0 && lw.every((w) => gw.includes(w));
  if (allLibInGif && equipMatches(libEquip, gif.equipment)) return 800 + lw.length * 10;
  if (allLibInGif) return 650 + lw.length * 5;

  if (gn.includes(ln) && equipMatches(libEquip, gif.equipment)) return 500;
  if (gn.includes(ln)) return 420;

  const overlap = lw.filter((w) => gw.includes(w)).length;
  const ratio = lw.length ? overlap / lw.length : 0;
  if (ratio >= 0.6 && equipMatches(libEquip, gif.equipment)) return 300 + overlap * 25;
  if (ratio >= 0.5 && equipMatches(libEquip, gif.equipment)) return 220 + overlap * 15;
  if (ratio >= 0.6) return 180 + overlap * 10;

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

async function searchExerciseDb(query) {
  const url = `${EXERCISEDB}?name=${encodeURIComponent(query)}&limit=15`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`ExerciseDB search failed: ${res.status}`);
    const json = await res.json();
    return (json.data ?? []).map((e) => ({
      name: e.name,
      gifUrl: e.gifUrl,
      equipment: (e.equipments ?? [])[0] ?? "",
      bodyParts: e.bodyParts ?? [],
      instructions: e.instructions,
    }));
  }
  return [];
}

async function fetchGifForExercise(lib, gymGifs) {
  // GymGifsDB is 360×360 — sharper than 180px ExerciseDB when shown in wide cards.
  if (gymGifs?.length) {
    const hit = pickBestGymGif(gymGifs, lib);
    if (hit) return hit;
  }

  const searchName = MANUAL_SEARCH[lib.id] ?? lib.name;
  const results = await searchExerciseDb(searchName);
  if (results.length) {
    const hit = pickBest(results, lib, 150);
    if (hit) return hit;
  }

  return null;
}

function pickBestGymGif(gifs, lib, minScore = 180) {
  const searchName = MANUAL_SEARCH[lib.id] ?? lib.name;
  let best = null;
  let bestScore = 0;
  for (const gif of gifs) {
    const s = scoreMatch(searchName, lib.equipment, gif);
    if (s > bestScore) {
      bestScore = s;
      best = gif;
    }
  }
  if (best && bestScore >= minScore) return { gif: best, score: bestScore - 50 };

  const folder = MUSCLE_TO_GIF[lib.muscle];
  if (folder) {
    const candidates = gifs.filter(
      (g) => g.muscle === folder || g.id?.startsWith(`${folder}/`) || g.file?.startsWith(`${folder}/`),
    );
    for (const gif of candidates) {
      const s = scoreMatch(searchName, lib.equipment, gif) + 50;
      if (s > bestScore) {
        bestScore = s;
        best = gif;
      }
    }
    if (best && bestScore >= 150) return { gif: best, score: bestScore - 50 };
  }

  return null;
}

function pickBest(gifs, lib, minScore = 180) {
  const searchName = MANUAL_SEARCH[lib.id] ?? lib.name;
  let best = null;
  let bestScore = 0;

  for (const gif of gifs) {
    const s = scoreMatch(searchName, lib.equipment, gif);
    if (s > bestScore) {
      bestScore = s;
      best = gif;
    }
  }
  if (best && bestScore >= minScore) return { gif: best, score: bestScore };

  const bodyPart = MUSCLE_TO_BODY[lib.muscle];
  if (bodyPart) {
    const candidates = gifs.filter((g) => g.bodyParts.includes(bodyPart));
    for (const gif of candidates) {
      const s = scoreMatch(searchName, lib.equipment, gif) + 50;
      if (s > bestScore) {
        bestScore = s;
        best = gif;
      }
    }
    if (best && bestScore >= 150) return { gif: best, score: bestScore };

    const eqMatch = candidates.find((g) => equipMatches(lib.equipment, g.equipment));
    if (eqMatch) return { gif: eqMatch, score: 100 };
  }

  return null;
}

async function main() {
  console.log("Loading GymGifsDB fallback…");
  const gymRes = await fetch(GIF_DB_FALLBACK);
  const { exercises: gymGifs } = await gymRes.json();
  console.log(`Matching library → GymGifsDB primary, ExerciseDB fallback (${gymGifs.length} gym gifs)…`);
  const library = parseLibrary();

  const map = {};
  let matched = 0;

  for (let i = 0; i < library.length; i++) {
    const lib = library[i];
    process.stdout.write(`\r  ${i + 1}/${library.length} ${lib.name.slice(0, 40).padEnd(40)}`);

    if (HARDCODED_GIFS[lib.id]) {
      map[lib.id] = { ...HARDCODED_GIFS[lib.id] };
      matched++;
      continue;
    }

    const hit = await fetchGifForExercise(lib, gymGifs);
    if (hit) {
      map[lib.id] = {
        gifUrl: hit.gif.gifUrl,
        sourceName: hit.gif.name,
        score: hit.score,
        instructions: hit.gif.instructions?.length ? hit.gif.instructions : undefined,
      };
      matched++;
    } else {
      map[lib.id] = null;
      console.warn(`\n  No match: ${lib.name} (${lib.equipment})`);
    }

    await new Promise((r) => setTimeout(r, 180));
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
