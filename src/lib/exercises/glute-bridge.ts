import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { allTrusted } from "@/lib/pose/landmark-quality";
import { clampScore } from "@/lib/scoring/score-utils";

/**
 * Supine hip-extension pattern (glute bridge, hip thrust, single-leg variants,
 * frog pump). Performed lying on the back with knees bent; tracks the hip angle
 * (shoulder–hip–knee): hips resting down read ~110–130°, full lockout at the top
 * reads ~165–178°. Inverted rep cycle (start angle < top angle).
 */
export const gluteBridgeConfig: ExerciseConfig = {
  id: "glute-bridge",
  name: "Glute Bridge",
  description: "Lie on your back, drive through the heels and squeeze your glutes to full lockout.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_KNEE, L.RIGHT_KNEE],
  phases: ["down", "lifting", "top"],
  caloriesPerRep: 0.25,

  repCycle: {
    primaryAngles: ["leftHip", "rightHip"],
    startThreshold: 128, // hips resting on the floor
    depthThreshold: 162, // full lockout at the top (inverted cycle)
    minROM: 28,
    minDepthFrames: 2,
    cooldownMs: 500,
  },

  detectPhase(angles: Record<string, number>): string {
    const avgHip = (angles.leftHip + angles.rightHip) / 2;
    if (avgHip < 132) return "down";
    if (avgHip > 158) return "top";
    return "lifting";
  },

  scoreRep(angles: Record<string, number>, landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;

    const leftOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE]);
    const rightOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_KNEE]);

    let avgHip = NaN;
    if (leftOk && rightOk) avgHip = (angles.leftHip + angles.rightHip) / 2;
    else if (leftOk) avgHip = angles.leftHip;
    else if (rightOk) avgHip = angles.rightHip;

    // Full lockout at the top.
    if (phase === "top" && isFinite(avgHip) && avgHip < 160) {
      score -= 15;
      issues.push({ joint: "hips", status: "moderate", message: "Squeeze your glutes higher at the top" });
    }

    // Symmetry.
    if (leftOk && rightOk) {
      const diff = Math.abs(angles.leftHip - angles.rightHip);
      if (diff > 16) {
        score -= Math.min(12, diff * 0.5);
        issues.push({ joint: "hips", status: "moderate", message: "Keep your hips level — don't let one side dip" });
      }
    }

    return { score: clampScore(score), issues };
  },

  getCoachingCues(angles: Record<string, number>, landmarks: Landmark[], phase: string): string[] {
    const leftOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE]);
    const rightOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_KNEE]);
    let avgHip = NaN;
    if (leftOk && rightOk) avgHip = (angles.leftHip + angles.rightHip) / 2;
    else if (leftOk) avgHip = angles.leftHip;
    else if (rightOk) avgHip = angles.rightHip;
    if (!isFinite(avgHip)) return [];

    if (phase === "top" && avgHip < 160) return ["Squeeze your glutes higher"];
    if (phase === "top") return ["Great lockout — pause and squeeze"];
    return ["Drive through your heels"];
  },
};
