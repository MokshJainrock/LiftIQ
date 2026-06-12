// Weight unit helpers. All stored data stays in lbs; conversion happens only
// at the display/input boundary so history and PRs remain consistent.

import { getSettings } from "@/lib/storage";

export type WeightUnit = "lbs" | "kg";

export const LBS_PER_KG = 2.2046226218;

export function getWeightUnit(): WeightUnit {
  return getSettings().units ?? "lbs";
}

/** lbs (stored) -> display number in the chosen unit, sensibly rounded. */
export function toDisplayWeight(lbs: number, unit: WeightUnit): number {
  const v = unit === "kg" ? lbs / LBS_PER_KG : lbs;
  return Math.round(v * 10) / 10;
}

/** user-entered number in the chosen unit -> lbs for storage. */
export function toStoredLbs(value: number, unit: WeightUnit): number {
  const lbs = unit === "kg" ? value * LBS_PER_KG : value;
  return Math.round(lbs * 100) / 100;
}

/** "225 lbs" / "102.1 kg" */
export function formatWeight(lbs: number, unit: WeightUnit): string {
  const v = toDisplayWeight(lbs, unit);
  return `${Number.isInteger(v) ? v : v.toFixed(1)} ${unit}`;
}

/** Volume totals: keep whole numbers — "12,340 lbs" / "5,597 kg". */
export function formatVolume(lbs: number, unit: WeightUnit): string {
  const v = unit === "kg" ? lbs / LBS_PER_KG : lbs;
  return `${Math.round(v).toLocaleString()} ${unit}`;
}
