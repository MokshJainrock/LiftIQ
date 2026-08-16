import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { allTrusted, vis, STRICT_TRUST_VIS } from "@/lib/pose/landmark-quality";
import { clampScore } from "@/lib/scoring/score-utils";

/**
 * Horizontal pull pattern (barbell/dumbbell/cable/machine rows, inverted rows).
 * Tracks elbow flexion: arms extended at the bottom read ~155–170°, the top of
 * the pull reads ~70–95°. Generalizes across bent-over and seated rows, so we
 * score depth + symmetry + that the elbows actually drive back (not just a
 * shrug), without hard-requiring a specific torso angle.
 */
export const rowConfig: ExerciseConfig = {
  id: "row",
  name: "Row",
  description: "Pull the weight to your torso, driving the elbows back and squeezing the shoulder blades.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_ELBOW, L.RIGHT_ELBOW, L.LEFT_WRIST, L.RIGHT_WRIST, L.LEFT_HIP, L.RIGHT_HIP],
  phases: ["extended", "pulling", "contracted"],
  caloriesPerRep: 0.35,

  repCycle: {
    primaryAngles: ["leftElbow", "rightElbow"],
    startThreshold: 150,
    depthThreshold: 95,
    minROM: 45,
    minDepthFrames: 2,
    cooldownMs: 500,
  },

  detectPhase(angles: Record<string, number>): string {
    const avg = (angles.leftElbow + angles.rightElbow) / 2;
    if (avg > 150) return "extended";
    if (avg < 100) return "contracted";
    return "pulling";
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

    // Depth of the pull — the elbow should close well past 100°.
    if (phase === "contracted" && isFinite(avg) && avg > 110) {
      score -= 15;
      issues.push({ joint: "elbows", status: "moderate", message: "Pull all the way to your torso" });
    }

    // Elbows should travel BEHIND the torso at the top (drive back, not up).
    const leftDrive =
      vis(landmarks, L.LEFT_ELBOW) >= STRICT_TRUST_VIS && vis(landmarks, L.LEFT_SHOULDER) >= STRICT_TRUST_VIS
        ? landmarks[L.LEFT_ELBOW].y - landmarks[L.LEFT_SHOULDER].y
        : NaN;
    if (phase === "contracted" && isFinite(leftDrive) && leftDrive < -0.05) {
      score -= 10;
      issues.push({ joint: "elbows", status: "moderate", message: "Drive elbows back, not up toward the ears" });
    }

    // Symmetry.
    if (leftOk && rightOk) {
      const diff = Math.abs(angles.leftElbow - angles.rightElbow);
      if (diff > 20) {
        score -= Math.min(12, diff * 0.4);
        issues.push({ joint: "arms", status: "moderate", message: "Pull evenly on both sides" });
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

    if (phase === "contracted" && avg > 110) return ["Pull to your torso", "Squeeze your shoulder blades"];
    if (phase === "extended") return ["Full stretch at the bottom"];
    return ["Control the negative"];
  },
};
