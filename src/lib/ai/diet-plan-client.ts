"use client";

import type { DietPlan, DietPlanInput } from "@/types";

export interface DietPlanResponse {
  title: string;
  summary: string;
  dailyCalories: number;
  macros: { protein: number; carbs: number; fat: number };
  meals: DietPlan["meals"];
  tips: string[];
  hydrationLiters?: number;
  source: "ai" | "fallback";
}

/** Request a personalized diet plan. Throws with a friendly message on failure. */
export async function fetchDietPlan(input: DietPlanInput): Promise<DietPlan> {
  const res = await fetch("/api/diet-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    let message = "Couldn't generate a plan. Please try again.";
    try {
      const data = await res.json();
      if (typeof data?.error === "string") message = data.error;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }

  const data = (await res.json()) as DietPlanResponse;

  return {
    id: `diet-${Date.now()}`,
    createdAt: Date.now(),
    input,
    title: data.title,
    summary: data.summary,
    dailyCalories: data.dailyCalories,
    macros: data.macros,
    meals: data.meals ?? [],
    tips: data.tips ?? [],
    hydrationLiters: data.hydrationLiters,
    source: data.source,
  };
}
