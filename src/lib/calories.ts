import { Gender, ActivityLevel, WeightGoal } from "@/types";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Mifflin-St Jeor equation for BMR estimation.
 * Uses weight in lbs, height in inches, age in years.
 */
export function calculateBMR(
  weightLbs: number,
  heightInches: number,
  age: number,
  gender: Gender
): number {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightInches * 2.54;

  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === "female") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
  // For "other", use average of male and female
  const male = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const female = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  return (male + female) / 2;
}

export function calculateTDEE(
  weightLbs: number,
  heightInches: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel
): number {
  const bmr = calculateBMR(weightLbs, heightInches, age, gender);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateRecommendedCalories(
  weightLbs: number,
  heightInches: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  goal: WeightGoal
): number {
  const tdee = calculateTDEE(weightLbs, heightInches, age, gender, activityLevel);

  switch (goal) {
    case "lose":
      return Math.max(1200, tdee - 500); // 500 cal deficit, floor of 1200
    case "gain":
      return tdee + 400; // 400 cal surplus
    case "maintain":
    default:
      return tdee;
  }
}

export function getGoalLabel(goal: WeightGoal): string {
  switch (goal) {
    case "lose": return "Lose Weight";
    case "gain": return "Gain Weight";
    case "maintain": return "Maintain Weight";
  }
}

/**
 * Recommend a daily macro split (grams) from a calorie target and goal.
 * Protein is anchored to bodyweight (higher for cut/gain), fat to a % of
 * calories, and carbs fill the remainder.
 */
export function recommendMacros(
  calories: number,
  weightLbs: number,
  goal: WeightGoal
): { protein: number; carbs: number; fat: number } {
  const proteinPerLb = goal === "lose" ? 1.0 : goal === "gain" ? 0.9 : 0.8;
  const protein = Math.round(weightLbs * proteinPerLb);

  const fatPct = goal === "lose" ? 0.28 : 0.25;
  const fat = Math.round((calories * fatPct) / 9);

  const remainingCals = Math.max(0, calories - protein * 4 - fat * 9);
  const carbs = Math.round(remainingCals / 4);

  return { protein, carbs, fat };
}

export function getActivityLabel(level: ActivityLevel): string {
  switch (level) {
    case "sedentary": return "Sedentary (desk job)";
    case "light": return "Light (1-3 days/week)";
    case "moderate": return "Moderate (3-5 days/week)";
    case "active": return "Active (6-7 days/week)";
    case "very_active": return "Very Active (2x/day)";
  }
}
