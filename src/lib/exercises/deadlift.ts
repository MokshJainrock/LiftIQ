import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { allTrusted } from "@/lib/pose/landmark-quality";
import { clampScore } from "@/lib/scoring/score-utils";

/**
 * Hip-hinge pattern (deadlift, RDL, good morning, sumo/rack pull, kettlebell
 * swing, pull-through, back extension). Tracks the hip angle (shoulder–hip–knee):
 * standing tall reads ~165–178°, the bottom of a hinge reads ~85–110°. The key
 * form distinction from a squat is that the KNEES stay relatively open — if the
 * knees bend heavily the movement has turned into a squat.
 */
export const deadliftConfig: ExerciseConfig = {
  id: "deadlift",
  name: "Deadlift",
  description: "Hinge at the hips with a flat back, push the floor away, stand tall and lock out.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_KNEE, L.RIGHT_KNEE, L.LEFT_ANKLE, L.RIGHT_ANKLE],
  phases: ["lockout", "descending", "bottom", "ascending"],
  caloriesPerRep: 0.5,

  repCycle: {
    primaryAngles: ["leftHip", "rightHip"],
    startThreshold: 160, // standing tall
    depthThreshold: 115, // hinged over
    minROM: 40,
    minDepthFrames: 2,
    cooldownMs: 650,
  },

  detectPhase(angles: Record<string, number>): string {
    const avgHip = (angles.leftHip + angles.rightHip) / 2;
    if (avgHip > 160) return "lockout";
    if (avgHip < 110) return "bottom";
    return "descending";
  },

  scoreRep(angles: Record<string, number>, landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;

    const leftOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE]);
    const rightOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_KNEE]);

    let avgHip = NaN;
    let avgKnee = NaN;
    if (leftOk && rightOk) {
      avgHip = (angles.leftHip + angles.rightHip) / 2;
      avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
    } else if (leftOk) {
      avgHip = angles.leftHip;
      avgKnee = angles.leftKnee;
    } else if (rightOk) {
      avgHip = angles.rightHip;
      avgKnee = angles.rightKnee;
    }

    // Lockout — hips fully extended at the top.
    if (phase === "lockout" && isFinite(avgHip) && avgHip < 165) {
      score -= 12;
      issues.push({ joint: "hips", status: "moderate", message: "Stand all the way up and squeeze your glutes" });
    }

    // Hinge vs squat — knees shouldn't collapse into a deep bend.
    if ((phase === "bottom" || phase === "descending") && isFinite(avgKnee) && avgKnee < 105) {
      score -= 15;
      issues.push({ joint: "knees", status: "moderate", message: "Hinge at the hips — don't squat the weight" });
    }

    // Symmetry.
    if (leftOk && rightOk) {
      const diff = Math.abs(angles.leftHip - angles.rightHip);
      if (diff > 18) {
        score -= Math.min(10, diff * 0.4);
        issues.push({ joint: "hips", status: "moderate", message: "Keep your hips level" });
      }
    }

    return { score: clampScore(score), issues };
  },

  getCoachingCues(angles: Record<string, number>, landmarks: Landmark[], phase: string): string[] {
    const leftOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE]);
    const rightOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_KNEE]);
    let avgHip = NaN;
    let avgKnee = NaN;
    if (leftOk && rightOk) {
      avgHip = (angles.leftHip + angles.rightHip) / 2;
      avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
    } else if (leftOk) {
      avgHip = angles.leftHip;
      avgKnee = angles.leftKnee;
    } else if (rightOk) {
      avgHip = angles.rightHip;
      avgKnee = angles.rightKnee;
    }
    if (!isFinite(avgHip)) return [];

    if ((phase === "bottom" || phase === "descending") && isFinite(avgKnee) && avgKnee < 105) {
      return ["Push your hips back", "Keep your shins vertical"];
    }
    if (phase === "lockout" && avgHip < 165) return ["Lock out your hips"];
    if (phase === "lockout") return ["Strong lockout!"];
    return ["Flat back, brace your core"];
  },
};
