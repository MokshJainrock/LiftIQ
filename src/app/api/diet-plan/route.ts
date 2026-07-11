import { NextRequest, NextResponse } from "next/server";
import { callOpenAI, isOpenAIAvailable } from "@/lib/ai/openai-client";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { buildDietPlanPrompt } from "@/lib/ai/diet-plan-prompts";
import { recommendMacros } from "@/lib/calories";
import type {
  ActivityLevel,
  DietPlanInput,
  DietPlanMeal,
  DietPreference,
  Gender,
  WeightGoal,
} from "@/types";

const PREFERENCES: DietPreference[] = [
  "omnivore",
  "vegetarian",
  "vegan",
  "pescatarian",
  "keto",
  "paleo",
  "mediterranean",
];
const GENDERS: Gender[] = ["male", "female", "other"];
const ACTIVITY: ActivityLevel[] = ["sedentary", "light", "moderate", "active", "very_active"];
const GOALS: WeightGoal[] = ["lose", "maintain", "gain"];

function num(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function sanitizeInput(raw: unknown): DietPlanInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const preference = PREFERENCES.includes(o.preference as DietPreference)
    ? (o.preference as DietPreference)
    : "omnivore";
  const gender = GENDERS.includes(o.gender as Gender) ? (o.gender as Gender) : "other";
  const activityLevel = ACTIVITY.includes(o.activityLevel as ActivityLevel)
    ? (o.activityLevel as ActivityLevel)
    : "moderate";
  const weightGoal = GOALS.includes(o.weightGoal as WeightGoal)
    ? (o.weightGoal as WeightGoal)
    : "maintain";

  return {
    weight: num(o.weight, 60, 700, 160),
    height: num(o.height, 36, 96, 68),
    age: num(o.age, 13, 100, 30),
    gender,
    activityLevel,
    weightGoal,
    calorieTarget: num(o.calorieTarget, 1000, 6000, 2000),
    preference,
    mealsPerDay: num(o.mealsPerDay, 2, 6, 3),
    allergies: typeof o.allergies === "string" ? o.allergies.slice(0, 300) : "",
    cuisines: typeof o.cuisines === "string" ? o.cuisines.slice(0, 200) : "",
    notes: typeof o.notes === "string" ? o.notes.slice(0, 400) : "",
  };
}

function n(v: unknown): number {
  const x = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(x) && x >= 0 ? Math.round(x) : 0;
}

function sanitizeMeals(raw: unknown): DietPlanMeal[] {
  if (!Array.isArray(raw)) return [];
  const out: DietPlanMeal[] = [];
  for (const m of raw) {
    if (out.length >= 6) break;
    const o = (m ?? {}) as Record<string, unknown>;
    const meal = typeof o.meal === "string" ? o.meal.trim() : "";
    if (!meal) continue;

    const items: DietPlanMeal["items"] = [];
    if (Array.isArray(o.items)) {
      for (const it of o.items) {
        if (items.length >= 10) break;
        const i = (it ?? {}) as Record<string, unknown>;
        const name = typeof i.name === "string" ? i.name.trim() : "";
        if (!name) continue;
        items.push({
          name,
          portion: typeof i.portion === "string" ? i.portion.trim() : "",
          calories: n(i.calories),
          protein: n(i.protein),
          carbs: n(i.carbs),
          fat: n(i.fat),
        });
      }
    }

    const calories = o.calories != null ? n(o.calories) : items.reduce((s, i) => s + i.calories, 0);
    const entry: DietPlanMeal = { meal, items, calories };
    if (typeof o.time === "string" && o.time.trim()) entry.time = o.time.trim();
    out.push(entry);
  }
  return out;
}

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`diet-plan:${clientKey(req)}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "Too many plan requests — give it a minute and try again." },
      { status: 429 }
    );
  }

  let input: DietPlanInput;
  try {
    const body = await req.json();
    input = sanitizeInput(body);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fallbackMacros = recommendMacros(input.calorieTarget, input.weight, input.weightGoal);

  if (!isOpenAIAvailable()) {
    return NextResponse.json({
      title: "Balanced Daily Plan",
      summary: "A simple balanced split based on your calorie target. Connect an AI key for a fully personalized plan.",
      dailyCalories: input.calorieTarget,
      macros: fallbackMacros,
      meals: [],
      tips: [
        "Aim to hit your protein target every day.",
        "Fill half your plate with vegetables.",
        "Drink water before each meal.",
      ],
      hydrationLiters: 2.5,
      source: "fallback",
    });
  }

  try {
    const res = await callOpenAI({
      prompt: buildDietPlanPrompt(input),
      temperature: 0.5,
      maxTokens: 1600,
      jsonMode: true,
    });

    if (!res.ok || !res.text) {
      return NextResponse.json({
        title: "Balanced Daily Plan",
        summary: "Couldn't reach the AI planner just now — here's a balanced macro split to start with.",
        dailyCalories: input.calorieTarget,
        macros: fallbackMacros,
        meals: [],
        tips: ["Hit your protein target.", "Prioritize whole foods.", "Stay hydrated."],
        hydrationLiters: 2.5,
        source: "fallback",
      });
    }

    const parsed = extractJson(res.text);
    if (!parsed) {
      return NextResponse.json(
        { error: "Couldn't parse the generated plan. Try again." },
        { status: 422 }
      );
    }

    const macrosRaw = (parsed.macros ?? {}) as Record<string, unknown>;
    const macros = {
      protein: macrosRaw.protein != null ? n(macrosRaw.protein) : fallbackMacros.protein,
      carbs: macrosRaw.carbs != null ? n(macrosRaw.carbs) : fallbackMacros.carbs,
      fat: macrosRaw.fat != null ? n(macrosRaw.fat) : fallbackMacros.fat,
    };
    const meals = sanitizeMeals(parsed.meals);
    const dailyCalories =
      parsed.dailyCalories != null
        ? n(parsed.dailyCalories)
        : meals.reduce((s, m) => s + m.calories, 0) || input.calorieTarget;

    const tips = Array.isArray(parsed.tips)
      ? parsed.tips.filter((t): t is string => typeof t === "string").slice(0, 6)
      : [];

    return NextResponse.json({
      title: typeof parsed.title === "string" ? parsed.title.slice(0, 80) : "Your Diet Plan",
      summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 400) : "",
      dailyCalories,
      macros,
      meals,
      tips,
      hydrationLiters: parsed.hydrationLiters != null ? n(parsed.hydrationLiters) : 2.5,
      source: "ai",
    });
  } catch (e) {
    console.error("diet-plan:", e);
    return NextResponse.json({ error: "Failed to generate a plan." }, { status: 500 });
  }
}
