/**
 * Synthetic rep-detector regression test (INTERNAL / dev-only).
 *
 * This feeds each rep-counting engine a *known* number of perfectly clean,
 * synthetic reps and asserts the detector counts exactly that many. It never
 * ships to users — it's a Node script run via `npm run test:reps`.
 *
 * Why it exists: the real-world accuracy of the rep counter depends on
 * MediaPipe landmark quality, framing and lighting, which we can only measure
 * empirically (see the in-app self-test harness at /dev/rep-accuracy). But the
 * *logic* — thresholds, hysteresis, cooldowns, ROM gating, the family guard —
 * must never silently regress when we tune an engine. This locks that down: if
 * a change makes a clean 12-rep set count 10 or 14, this test fails loudly.
 *
 * How it works: the pose-family classifier only looks at shoulders/hips/
 * knees/ankles, so we can drive an engine's primary joint angle precisely by
 * repositioning a single distal landmark while keeping the body in the right
 * pose family. We advance a virtual clock so real cooldowns are respected.
 */

import type { Landmark } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { exercises } from "@/lib/exercises";
import { REQUIRED_FAMILY } from "@/lib/exercises/start-validators";
import { RepDetector } from "@/lib/scoring/rep-detector";
import { classifyPoseFamily } from "@/lib/pose/pose-family";

const DEBUG = process.env.DEBUG_REPS === "1";
const REPS = 12;
const FRAME_MS = 80; // virtual frame spacing; > every engine's cooldownMs/rep

// ── landmark helpers ──────────────────────────────────────────────
function pt(x: number, y: number): Landmark {
  return { x, y, z: 0, visibility: 1 };
}

function emptyPose(): Landmark[] {
  return Array.from({ length: 33 }, () => pt(0.5, 0.5));
}

function clone(p: Landmark[]): Landmark[] {
  return p.map((l) => ({ ...l }));
}

/**
 * Reposition `movable` around `vertex` so that angle(fixed, vertex, movable)
 * exactly equals `deg`. calculateAngle is 2-D (x/y only) so this is exact.
 */
function setAngle(
  lm: Landmark[],
  vertexIdx: number,
  fixedIdx: number,
  movableIdx: number,
  deg: number,
  len: number,
  sign: number,
) {
  const v = lm[vertexIdx];
  const fx = lm[fixedIdx];
  let dx = fx.x - v.x;
  let dy = fx.y - v.y;
  const m = Math.hypot(dx, dy) || 1;
  dx /= m;
  dy /= m;
  const r = (sign * deg * Math.PI) / 180;
  const rx = dx * Math.cos(r) - dy * Math.sin(r);
  const ry = dx * Math.sin(r) + dy * Math.cos(r);
  lm[movableIdx] = { x: v.x + len * rx, y: v.y + len * ry, z: 0, visibility: 1 };
}

// ── base skeletons per pose family ────────────────────────────────
function standingBase(): Landmark[] {
  const a = emptyPose();
  a[L.NOSE] = pt(0.5, 0.12);
  a[L.LEFT_SHOULDER] = pt(0.42, 0.3);
  a[L.RIGHT_SHOULDER] = pt(0.58, 0.3);
  a[L.LEFT_ELBOW] = pt(0.4, 0.45);
  a[L.RIGHT_ELBOW] = pt(0.6, 0.45);
  a[L.LEFT_WRIST] = pt(0.39, 0.6);
  a[L.RIGHT_WRIST] = pt(0.61, 0.6);
  a[L.LEFT_HIP] = pt(0.45, 0.55);
  a[L.RIGHT_HIP] = pt(0.55, 0.55);
  a[L.LEFT_KNEE] = pt(0.45, 0.75);
  a[L.RIGHT_KNEE] = pt(0.55, 0.75);
  a[L.LEFT_ANKLE] = pt(0.45, 0.93);
  a[L.RIGHT_ANKLE] = pt(0.55, 0.93);
  a[L.LEFT_HEEL] = pt(0.44, 0.96);
  a[L.RIGHT_HEEL] = pt(0.56, 0.96);
  a[L.LEFT_FOOT_INDEX] = pt(0.46, 0.98);
  a[L.RIGHT_FOOT_INDEX] = pt(0.54, 0.98);
  return a;
}

function plankBase(): Landmark[] {
  const a = emptyPose();
  a[L.NOSE] = pt(0.2, 0.54);
  a[L.LEFT_SHOULDER] = pt(0.3, 0.55);
  a[L.RIGHT_SHOULDER] = pt(0.31, 0.56);
  a[L.LEFT_ELBOW] = pt(0.28, 0.68);
  a[L.RIGHT_ELBOW] = pt(0.29, 0.68);
  a[L.LEFT_WRIST] = pt(0.28, 0.8);
  a[L.RIGHT_WRIST] = pt(0.29, 0.8);
  a[L.LEFT_HIP] = pt(0.55, 0.57);
  a[L.RIGHT_HIP] = pt(0.56, 0.57);
  a[L.LEFT_KNEE] = pt(0.72, 0.58);
  a[L.RIGHT_KNEE] = pt(0.73, 0.58);
  a[L.LEFT_ANKLE] = pt(0.88, 0.59);
  a[L.RIGHT_ANKLE] = pt(0.89, 0.59);
  a[L.LEFT_HEEL] = pt(0.9, 0.6);
  a[L.RIGHT_HEEL] = pt(0.91, 0.6);
  a[L.LEFT_FOOT_INDEX] = pt(0.92, 0.62);
  a[L.RIGHT_FOOT_INDEX] = pt(0.93, 0.62);
  return a;
}

function seatedBase(): Landmark[] {
  const a = emptyPose();
  a[L.NOSE] = pt(0.32, 0.42);
  a[L.LEFT_SHOULDER] = pt(0.36, 0.5);
  a[L.RIGHT_SHOULDER] = pt(0.38, 0.5);
  a[L.LEFT_ELBOW] = pt(0.4, 0.6);
  a[L.RIGHT_ELBOW] = pt(0.42, 0.6);
  a[L.LEFT_WRIST] = pt(0.45, 0.66);
  a[L.RIGHT_WRIST] = pt(0.47, 0.66);
  a[L.LEFT_HIP] = pt(0.45, 0.7);
  a[L.RIGHT_HIP] = pt(0.46, 0.7);
  a[L.LEFT_KNEE] = pt(0.6, 0.66);
  a[L.RIGHT_KNEE] = pt(0.61, 0.66);
  a[L.LEFT_ANKLE] = pt(0.55, 0.54);
  a[L.RIGHT_ANKLE] = pt(0.56, 0.54);
  a[L.LEFT_HEEL] = pt(0.54, 0.55);
  a[L.RIGHT_HEEL] = pt(0.55, 0.55);
  a[L.LEFT_FOOT_INDEX] = pt(0.5, 0.5);
  a[L.RIGHT_FOOT_INDEX] = pt(0.51, 0.5);
  return a;
}

type PrimaryKind = "elbow" | "knee" | "hip" | "shoulder";

function primaryKind(primaryAngles: string[]): PrimaryKind {
  const k = primaryAngles[0] ?? "";
  if (k.includes("Elbow")) return "elbow";
  if (k.includes("Knee")) return "knee";
  if (k.includes("Hip")) return "hip";
  return "shoulder";
}

function baseForFamily(id: string): Landmark[] {
  const fam = REQUIRED_FAMILY[id];
  if (fam === "floor_plank") return plankBase();
  if (fam === "seated_floor") return seatedBase();
  return standingBase();
}

/** Build one synthetic frame posing the engine's primary joint at `deg`. */
function frameFor(id: string, kind: PrimaryKind, deg: number): Landmark[] {
  const lm = clone(baseForFamily(id));
  switch (kind) {
    case "elbow":
      setAngle(lm, L.LEFT_ELBOW, L.LEFT_SHOULDER, L.LEFT_WRIST, deg, 0.15, 1);
      setAngle(lm, L.RIGHT_ELBOW, L.RIGHT_SHOULDER, L.RIGHT_WRIST, deg, 0.15, -1);
      break;
    case "shoulder":
      setAngle(lm, L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_ELBOW, deg, 0.15, -1);
      setAngle(lm, L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_ELBOW, deg, 0.15, 1);
      break;
    case "knee":
      setAngle(lm, L.LEFT_KNEE, L.LEFT_HIP, L.LEFT_ANKLE, deg, 0.18, 1);
      setAngle(lm, L.RIGHT_KNEE, L.RIGHT_HIP, L.RIGHT_ANKLE, deg, 0.18, -1);
      break;
    case "hip":
      setAngle(lm, L.LEFT_HIP, L.LEFT_SHOULDER, L.LEFT_KNEE, deg, 0.2, 1);
      setAngle(lm, L.RIGHT_HIP, L.RIGHT_SHOULDER, L.RIGHT_KNEE, deg, 0.2, -1);
      break;
  }
  return lm;
}

function lerp(from: number, to: number, steps: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= steps; i++) out.push(from + ((to - from) * i) / steps);
  return out;
}

const clamp = (v: number) => Math.max(12, Math.min(172, v));

/** Build the full angle stream for `reps` clean reps of one engine. */
function angleStream(start: number, depth: number, reps: number): number[] {
  const inverted = start < depth;
  const top = clamp(inverted ? start - 12 : start + 12);
  const bot = clamp(inverted ? depth + 14 : depth - 14);

  const oneRep: number[] = [
    ...Array(6).fill(top),
    ...lerp(top, bot, 8),
    ...Array(5).fill(bot),
    ...lerp(bot, top, 8),
  ];

  const stream: number[] = [...Array(6).fill(top)]; // settle at start
  for (let i = 0; i < reps; i++) stream.push(...oneRep);
  // Trailing settle: the last rep's return-to-start would otherwise rely on the
  // next rep's leading frames, so hold at the top long enough for the smoothing
  // window to catch up and register the final rep.
  stream.push(...Array(8).fill(top));
  return stream;
}

// ── run ───────────────────────────────────────────────────────────
interface Row {
  id: string;
  expected: number;
  counted: number;
  ok: boolean;
  families: string;
}

function run(): Row[] {
  const rows: Row[] = [];
  const realNow = Date.now.bind(Date);
  let clock = 1_000_000;
  // Virtual clock so cooldownMs (real-time gated) behaves like 1 frame = FRAME_MS.
  (Date as unknown as { now: () => number }).now = () => clock;

  try {
    for (const [id, config] of Object.entries(exercises)) {
      const cycle = config.repCycle;
      if (!cycle) continue; // plank (hold) has no rep cycle

      const kind = primaryKind(cycle.primaryAngles);
      const stream = angleStream(cycle.startThreshold, cycle.depthThreshold, REPS);
      const detector = new RepDetector(config);
      const famCount: Record<string, number> = {};

      for (const deg of stream) {
        const lm = frameFor(id, kind, deg);
        if (DEBUG) {
          const f = classifyPoseFamily(lm).family;
          famCount[f] = (famCount[f] ?? 0) + 1;
        }
        detector.update(lm);
        clock += FRAME_MS;
      }

      const counted = detector.getRepCount();
      rows.push({
        id,
        expected: REPS,
        counted,
        ok: counted === REPS,
        families: Object.entries(famCount)
          .map(([f, n]) => `${f}:${n}`)
          .join(" "),
      });
    }
  } finally {
    (Date as unknown as { now: () => number }).now = realNow;
  }

  return rows;
}

const rows = run();
const pad = (s: string, n: number) => s.padEnd(n);

console.log("\nSynthetic rep-detector regression test");
console.log("=".repeat(52));
console.log(`${pad("exercise", 20)}${pad("expect", 8)}${pad("count", 8)}result`);
console.log("-".repeat(52));
for (const r of rows) {
  console.log(
    `${pad(r.id, 20)}${pad(String(r.expected), 8)}${pad(String(r.counted), 8)}${
      r.ok ? "PASS" : "FAIL"
    }`,
  );
  if (DEBUG) console.log(`  families: ${r.families}`);
}
console.log("-".repeat(52));

const failed = rows.filter((r) => !r.ok);
console.log(`${rows.length - failed.length}/${rows.length} engines passed\n`);

if (failed.length > 0) {
  console.error("FAILED engines: " + failed.map((r) => r.id).join(", "));
  process.exit(1);
}
