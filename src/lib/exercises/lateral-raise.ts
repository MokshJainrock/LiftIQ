import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { allTrusted } from "@/lib/pose/landmark-quality";
import { clampScore } from "@/lib/scoring/score-utils";

/**
 * Shoulder-raise pattern (lateral raise, front raise, rear-delt fly, Y-raise,
 * upright row). Tracks arm abduction/flexion via the shoulder angle
 * (elbow–shoulder–hip): arms at the sides read ~15–25°, arms at shoulder
 * height read ~85–95°. The rep cycle is inverted (start angle < top angle).
 */
export const lateralRaiseConfig: ExerciseConfig = {
  id: "lateral-raise",
  name: "Lateral Raise",
  description: "Arms at your sides, raise out to shoulder height, lead with the elbows.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_ELBOW, L.RIGHT_ELBOW, L.LEFT_HIP, L.RIGHT_HIP],
  phases: ["down", "raising", "top"],
  caloriesPerRep: 0.2,

  repCycle: {
    primaryAngles: ["leftShoulder", "rightShoulder"],
    startThreshold: 30, // arms down at the sides
    depthThreshold: 78, // arms up at shoulder height (inverted cycle)
    minROM: 35,
    minDepthFrames: 2,
    cooldownMs: 500,
  },

  detectPhase(angles: Record<string, number>): string {
    const avg = (angles.leftShoulder + angles.rightShoulder) / 2;
    if (avg < 35) return "down";
    if (avg > 72) return "top";
    return "raising";
  },

  scoreRep(angles: Record<string, number>, landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;

    const leftOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_HIP]);
    const rightOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_HIP]);

    let avg = NaN;
    if (leftOk && rightOk) avg = (angles.leftShoulder + angles.rightShoulder) / 2;
    else if (leftOk) avg = angles.leftShoulder;
    else if (rightOk) avg = angles.rightShoulder;

    if (phase === "top" && isFinite(avg)) {
      if (avg < 70) {
        score -= 15;
        issues.push({ joint: "shoulders", status: "moderate", message: "Raise up to shoulder height" });
      } else if (avg > 120) {
        score -= 12;
        issues.push({ joint: "shoulders", status: "moderate", message: "Don't swing above the shoulders" });
      }
    }

    // Symmetry — both arms should rise together.
    if (leftOk && rightOk) {
      const diff = Math.abs(angles.leftShoulder - angles.rightShoulder);
      if (diff > 18) {
        score -= Math.min(15, diff * 0.5);
        issues.push({ joint: "arms", status: "moderate", message: "Raise both arms evenly" });
      }
    }

    return { score: clampScore(score), issues };
  },

  getCoachingCues(angles: Record<string, number>, landmarks: Landmark[], phase: string): string[] {
    const leftOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_HIP]);
    const rightOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_HIP]);
    let avg = NaN;
    if (leftOk && rightOk) avg = (angles.leftShoulder + angles.rightShoulder) / 2;
    else if (leftOk) avg = angles.leftShoulder;
    else if (rightOk) avg = angles.rightShoulder;
    if (!isFinite(avg)) return [];

    if (phase === "top" && avg < 70) return ["Raise to shoulder height"];
    if (phase === "top" && avg > 120) return ["Keep it at shoulder level"];
    if (phase === "raising") return ["Slow and controlled"];
    return [];
  },
};
