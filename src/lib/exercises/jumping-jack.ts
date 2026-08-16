import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { calculateDistance2D, POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { vis } from "@/lib/pose/landmark-quality";
import { clampFormScore } from "@/lib/scoring/score-utils";

function avgShoulderOpen(angles: Record<string, number>): number {
  const l = angles.leftShoulder ?? 0;
  const r = angles.rightShoulder ?? 0;
  return (l + r) / 2;
}

/** Wrists above the shoulders (smaller y) = arms raised. */
function armsRaised(landmarks: Landmark[]): boolean {
  const ls = landmarks[L.LEFT_SHOULDER];
  const rs = landmarks[L.RIGHT_SHOULDER];
  const lw = landmarks[L.LEFT_WRIST];
  const rw = landmarks[L.RIGHT_WRIST];
  if (!ls || !rs || !lw || !rw) return false;
  const shoulderY = (ls.y + rs.y) / 2;
  const wristY = (lw.y + rw.y) / 2;
  return wristY < shoulderY - 0.04;
}

function legsOpen(landmarks: Landmark[]): boolean {
  const la = landmarks[L.LEFT_ANKLE];
  const ra = landmarks[L.RIGHT_ANKLE];
  const lh = landmarks[L.LEFT_HIP];
  const rh = landmarks[L.RIGHT_HIP];
  if (!la || !ra || !lh || !rh) return false;
  if (vis(landmarks, L.LEFT_ANKLE) < 0.3 && vis(landmarks, L.RIGHT_ANKLE) < 0.3) return false;
  const ankleSpan = calculateDistance2D(la, ra);
  const hipSpan = Math.max(0.04, calculateDistance2D(lh, rh));
  return ankleSpan > hipSpan * 1.45;
}

export const jumpingJackConfig: ExerciseConfig = {
  id: "jumping-jack",
  name: "Jumping Jack",
  description: "Jump while spreading legs and raising arms overhead, then return.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_WRIST, L.RIGHT_WRIST, L.LEFT_ANKLE, L.RIGHT_ANKLE],
  phases: ["closed", "open"],
  caloriesPerRep: 0.2,

  repCycle: {
    primaryAngles: ["leftShoulder", "rightShoulder"],
    startThreshold: 75,
    depthThreshold: 118,
    minROM: 30,
    minDepthFrames: 1,
    cooldownMs: 220,
  },

  detectPhase(angles: Record<string, number>, landmarks: Landmark[]): string {
    const open =
      avgShoulderOpen(angles) > 115 || armsRaised(landmarks) || legsOpen(landmarks);
    return open ? "open" : "closed";
  },

  scoreRep(angles: Record<string, number>, landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;
    const openAngle = avgShoulderOpen(angles);
    const raised = armsRaised(landmarks);
    const spread = legsOpen(landmarks);
    const openish = raised || openAngle >= 115;

    if (phase === "open") {
      if (!openish) {
        score -= 12;
        issues.push({ joint: "arms", status: "moderate", message: "Raise arms higher" });
      }
      if (!spread) {
        score -= 10;
        issues.push({ joint: "hips", status: "moderate", message: "Step the feet wider" });
      }
    }

    // A completed jack with both arms and legs working is a good rep.
    if (openish && spread) {
      score = Math.max(score, 90);
    } else if (openish || spread) {
      score = Math.max(score, 78);
    }

    return { score: clampFormScore(score), issues };
  },

  getCoachingCues(angles: Record<string, number>, landmarks: Landmark[]): string[] {
    const openAngle = avgShoulderOpen(angles);
    const open = openAngle > 115 || armsRaised(landmarks) || legsOpen(landmarks);
    if (!open) return ["Good rhythm!"];
    if (!armsRaised(landmarks) && openAngle < 125) return ["Arms higher!"];
    if (!legsOpen(landmarks)) return ["Feet wider!"];
    return ["Good rhythm!"];
  },
};
