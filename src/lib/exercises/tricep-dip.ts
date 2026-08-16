import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { allTrusted } from "@/lib/pose/landmark-quality";
import { clampScore } from "@/lib/scoring/score-utils";

/**
 * Vertical dip pattern (parallel-bar dips, bench/chair dips). Tracks elbow
 * flexion: locked out at the top reads ~160–175°, the bottom of a dip reads
 * ~80–100°. Scores depth + symmetry.
 */
export const tricepDipConfig: ExerciseConfig = {
  id: "tricep-dip",
  name: "Tricep Dip",
  description: "Support your body on straight arms, lower until elbows reach ~90°, press back to lockout.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_ELBOW, L.RIGHT_ELBOW, L.LEFT_WRIST, L.RIGHT_WRIST],
  phases: ["top", "descending", "bottom"],
  caloriesPerRep: 0.35,

  repCycle: {
    primaryAngles: ["leftElbow", "rightElbow"],
    startThreshold: 155,
    depthThreshold: 100,
    minROM: 45,
    minDepthFrames: 2,
    cooldownMs: 450,
  },

  detectPhase(angles: Record<string, number>): string {
    const avg = (angles.leftElbow + angles.rightElbow) / 2;
    if (avg > 155) return "top";
    if (avg < 105) return "bottom";
    return "descending";
  },

  scoreRep(angles: Record<string, number>, landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;

    const leftOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST]);
    const rightOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST]);

    let avg = NaN;
    if (leftOk && rightOk) avg = (angles.leftElbow + angles.rightElbow) / 2;
    else if (leftOk) avg = angles.leftElbow;
    else if (rightOk) avg = angles.rightElbow;

    // Depth — go to about 90° at the bottom.
    if (phase === "bottom" && isFinite(avg) && avg > 110) {
      score -= 15;
      issues.push({ joint: "elbows", status: "moderate", message: "Lower until your elbows reach ~90°" });
    }

    // Lockout at the top.
    if (phase === "top" && isFinite(avg) && avg < 160) {
      score -= 10;
      issues.push({ joint: "elbows", status: "moderate", message: "Press to full lockout at the top" });
    }

    // Symmetry.
    if (leftOk && rightOk) {
      const diff = Math.abs(angles.leftElbow - angles.rightElbow);
      if (diff > 20) {
        score -= Math.min(12, diff * 0.4);
        issues.push({ joint: "arms", status: "moderate", message: "Press evenly on both arms" });
      }
    }

    return { score: clampScore(score), issues };
  },

  getCoachingCues(angles: Record<string, number>, landmarks: Landmark[], phase: string): string[] {
    const leftOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST]);
    const rightOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST]);
    let avg = NaN;
    if (leftOk && rightOk) avg = (angles.leftElbow + angles.rightElbow) / 2;
    else if (leftOk) avg = angles.leftElbow;
    else if (rightOk) avg = angles.rightElbow;
    if (!isFinite(avg)) return [];

    if (phase === "bottom" && avg > 110) return ["Go a little deeper"];
    if (phase === "top" && avg < 160) return ["Full lockout at the top"];
    return ["Keep your elbows tucked"];
  },
};
