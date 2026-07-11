import { Landmark } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { frameTrust, vis } from "@/lib/pose/landmark-quality";

/** How much we trust tracking + scoring for this frame. */
export type TrackingTier = "high" | "medium" | "low";

export interface TrackingQuality {
  tier: TrackingTier;
  frameTrust: number;
  /** True only when tier is high — UI should show 0–100 score. */
  scoreAvailable: boolean;
  /** Short label for HUD ("High confidence", etc.) */
  label: string;
  /** Setup / framing hints for the validation checklist. */
  checklist: SetupCheckItem[];
}

export interface SetupCheckItem {
  id: string;
  label: string;
  ok: boolean;
  hint?: string;
}

const CORE = [
  L.LEFT_SHOULDER, L.RIGHT_SHOULDER,
  L.LEFT_HIP, L.RIGHT_HIP,
  L.LEFT_KNEE, L.RIGHT_KNEE,
];

function bodySpan(landmarks: Landmark[]): number {
  const ys = [L.NOSE, L.LEFT_ANKLE, L.RIGHT_ANKLE, L.LEFT_SHOULDER, L.RIGHT_SHOULDER]
    .map((i) => landmarks[i]?.y)
    .filter((y): y is number => typeof y === "number" && Number.isFinite(y));
  if (ys.length < 2) return 0;
  return Math.max(...ys) - Math.min(...ys);
}

function shoulderLevel(landmarks: Landmark[]): boolean {
  const ls = landmarks[L.LEFT_SHOULDER];
  const rs = landmarks[L.RIGHT_SHOULDER];
  if (!ls || !rs) return false;
  if ((ls.visibility ?? 0) < 0.5 || (rs.visibility ?? 0) < 0.5) return false;
  return Math.abs(ls.y - rs.y) < 0.08;
}

/**
 * Vision-only setup + confidence assessment (web — no ARKit/LiDAR).
 * Uses landmark visibility, body span in frame, and shoulder level as proxies
 * for distance, framing, and camera angle.
 */
export function assessTrackingQuality(
  landmarks: Landmark[],
  cameraFacing: "user" | "environment" = "environment",
  depthAssist = false,
): TrackingQuality {
  // Depth-class hardware (LiDAR / multi-lens / WebXR depth) gives us a more
  // reliable sense of scale + framing, so we can trust a given frame a little
  // more and require slightly less-perfect positioning.
  const trust = Math.min(1, frameTrust(landmarks, CORE) + (depthAssist ? 0.06 : 0));
  const anklesOk =
    (vis(landmarks, L.LEFT_ANKLE) >= 0.4 || vis(landmarks, L.RIGHT_ANKLE) >= 0.4);
  const shouldersOk =
    vis(landmarks, L.LEFT_SHOULDER) >= 0.55 && vis(landmarks, L.RIGHT_SHOULDER) >= 0.55;
  const hipsOk =
    vis(landmarks, L.LEFT_HIP) >= 0.55 && vis(landmarks, L.RIGHT_HIP) >= 0.55;
  const fullBody = shouldersOk && hipsOk && anklesOk;

  const span = bodySpan(landmarks);
  const tooClose = span > 0.82;
  const tooFar = span > 0 && span < 0.35;
  const goodDistance = span >= 0.45 && span <= 0.78;
  const level = shoulderLevel(landmarks);

  const checklist: SetupCheckItem[] = [
    {
      id: "camera",
      label: cameraFacing === "environment" ? "Rear camera active" : "Front camera (switch to rear for gym)",
      ok: cameraFacing === "environment",
      hint: cameraFacing === "user" ? "Use the flip button for rear camera + wider view" : undefined,
    },
    {
      id: "body",
      label: "Full body visible",
      ok: fullBody,
      hint: fullBody ? undefined : "Step back until shoulders, hips, and feet are in frame",
    },
    {
      id: "distance",
      label: "Good distance (~2 m)",
      ok: goodDistance && !tooClose && !tooFar,
      hint: tooClose ? "Move the phone farther back" : tooFar ? "Move closer — body too small" : "Adjust distance",
    },
    {
      id: "angle",
      label: "Camera angle level",
      ok: level,
      hint: level ? undefined : "Raise the phone — keep shoulders level in frame",
    },
    {
      id: "visibility",
      label: "Landmark confidence",
      ok: trust >= 0.55,
      hint: trust < 0.55 ? "Improve lighting or reduce background clutter" : undefined,
    },
  ];

  if (depthAssist) {
    checklist.push({
      id: "depth",
      label: "Depth sensing active",
      ok: true,
      hint: undefined,
    });
  }

  const checksPassed = checklist.filter((c) => c.id !== "camera" || cameraFacing === "environment").filter((c) => c.ok).length;
  const setupScore = checksPassed / checklist.length;

  // Depth-class hardware slightly lowers the bar for "high" confidence.
  const highTrust = depthAssist ? 0.58 : 0.62;
  const highSetup = depthAssist ? 0.55 : 0.6;

  let tier: TrackingTier = "low";
  if (trust >= highTrust && fullBody && goodDistance && level && setupScore >= highSetup) {
    tier = "high";
  } else if (trust >= 0.48 && shouldersOk && hipsOk) {
    tier = "medium";
  }

  const scoreAvailable = tier === "high";

  const label =
    tier === "high"
      ? "High confidence"
      : tier === "medium"
      ? "Medium — limited scoring"
      : "Low — reps only";

  return { tier, frameTrust: trust, scoreAvailable, label, checklist };
}

/** Cap or hide live score based on tier. */
export function displayScore(rawScore: number, tier: TrackingTier): number | null {
  if (tier === "low") return null;
  if (tier === "medium") return Math.min(rawScore, 85);
  return rawScore;
}
