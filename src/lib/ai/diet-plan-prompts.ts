import type { DietPlanInput } from "@/types";
import { getGoalLabel, getActivityLabel } from "@/lib/calories";

function heightLabel(inches: number): string {
  const ft = Math.floor(inches / 12);
  const inch = Math.round(inches % 12);
  return `${ft}'${inch}"`;
}

/**
 * Build the structured-JSON prompt for the diet-plan generator. The model must
 * return a single JSON object we can render directly into the plan UI.
 */
export function buildDietPlanPrompt(input: DietPlanInput): string {
  const {
    weight,
    height,
    age,
    gender,
    activityLevel,
    weightGoal,
    calorieTarget,
    preference,
    mealsPerDay,
    allergies,
    cuisines,
    notes,
  } = input;

  return `You are a registered-dietitian-style meal planner. Create a realistic, balanced ONE-DAY diet plan tailored to this person.

PERSON:
- Age: ${age}, Sex: ${gender}
- Weight: ${weight} lbs, Height: ${heightLabel(height)}
- Activity: ${getActivityLabel(activityLevel)}
- Goal: ${getGoalLabel(weightGoal)}
- Daily calorie target: ${calorieTarget} kcal
- Diet preference: ${preference}
- Meals per day: ${mealsPerDay}
- Allergies / foods to avoid: ${allergies || "none stated"}
- Preferred cuisines: ${cuisines || "no preference"}
- Extra notes: ${notes || "none"}

REQUIREMENTS:
- Respect the diet preference strictly (e.g. vegan = no animal products).
- Absolutely avoid every listed allergy/food.
- Distribute calories across exactly ${mealsPerDay} meals; the day's total should be within ~5% of ${calorieTarget} kcal.
- Prioritize adequate protein for the goal; keep foods common and affordable.
- Portions must be concrete and measurable (e.g. "1 cup", "150 g", "2 eggs").

Respond with ONLY valid JSON (no markdown, no code fences) in EXACTLY this shape:
{
  "title": string,                       // short plan name
  "summary": string,                     // 1-2 sentence overview
  "dailyCalories": number,               // total for the day
  "macros": { "protein": number, "carbs": number, "fat": number },  // grams/day
  "meals": [
    {
      "meal": string,                    // "Breakfast", "Lunch", "Snack", ...
      "time": string,                    // suggested time, e.g. "8:00 AM"
      "items": [
        { "name": string, "portion": string, "calories": number, "protein": number, "carbs": number, "fat": number }
      ],
      "calories": number                 // meal total
    }
  ],
  "tips": [string],                      // 3-5 concise, actionable tips
  "hydrationLiters": number              // recommended daily water intake
}
Keep it concise and realistic. Numbers are integers.`;
}
