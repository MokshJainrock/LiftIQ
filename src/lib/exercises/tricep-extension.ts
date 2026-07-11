import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { allTrusted, vis, STRICT_TRUST_VIS } from "@/lib/pose/landmark-quality";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Elbow-extension pattern (tricep pushdown, rope pushdown, overhead extension,
 * kickback, skull crusher). The upper arm stays fixed while the forearm extends:
 * the working elbow angle cycles from ~80–95° (flexed) to ~160–175° (locked out).
 * Inverted rep cycle (start angle < locked-out angle).
 */
export const tricepExtensionConfig: ExerciseConfig = {
  id: "tricep-extension",
  name: "Tricep Extension",
  description: "Keep your upper arms fixed and extend at the elbow to full lockout, then control back.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_ELBOW, L.RIGHT_ELBOW, L.LEFT_WRIST, L.RIGHT_WRIST],
  phases: ["flexed", "extending", "locked"],
  caloriesPerRep: 0.2,

  repCycle: {
    primaryAngles: ["leftElbow", "rightElbow"],
    startThreshold: 95, // flexed
    depthThreshold: 158, // locked out (inverted cycle)
    minROM: 45,
    minDepthFrames: 2,
    cooldownMs: 450,
  },

  detectPhase(angles: Record<string, number>): string {
    const avg = (angles.leftElbow + angles.rightElbow) / 2;
    if (avg < 100) return "flexed";
    if (avg > 155) return "locked";
    return "extending";
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

    // Full lockout at the bottom/end of the extension.
    if (phase === "locked" && isFinite(avg) && avg < 160) {
      score -= 15;
      issues.push({ joint: "elbows", status: "moderate", message: "Extend all the way to lockout" });
    }

    // Upper arm should stay pinned — elbows shouldn't drift forward/away.
    const leftDrift =
      vis(landmarks, L.LEFT_ELBOW) >= STRICT_TRUST_VIS && vis(landmarks, L.LEFT_SHOULDER) >= STRICT_TRUST_VIS
        ? Math.abs(landmarks[L.LEFT_ELBOW].x - landmarks[L.LEFT_SHOULDER].x)
        : 0;
    const rightDrift =
      vis(landmarks, L.RIGHT_ELBOW) >= STRICT_TRUST_VIS && vis(landmarks, L.RIGHT_SHOULDER) >= STRICT_TRUST_VIS
        ? Math.abs(landmarks[L.RIGHT_ELBOW].x - landmarks[L.RIGHT_SHOULDER].x)
        : 0;
    if (leftDrift > 0.12 || rightDrift > 0.12) {
      score -= 10;
      issues.push({ joint: "elbows", status: "moderate", message: "Keep your upper arms pinned in place" });
    }

    // Symmetry.
    if (leftOk && rightOk) {
      const diff = Math.abs(angles.leftElbow - angles.rightElbow);
      if (diff > 20) {
        score -= Math.min(12, diff * 0.4);
        issues.push({ joint: "arms", status: "moderate", message: "Extend both arms evenly" });
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

    if (phase === "locked" && avg < 160) return ["Lock out at the bottom"];
    if (phase === "flexed") return ["Keep your elbows pinned"];
    return ["Control the weight back"];
  },
};
