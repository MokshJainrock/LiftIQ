"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Button } from "@/components/ui/button";
import { getUserProfile, getDietPlan, saveDietPlan } from "@/lib/storage";
import { calculateRecommendedCalories } from "@/lib/calories";
import { fetchDietPlan } from "@/lib/ai/diet-plan-client";
import type { DietPlan, DietPlanInput, DietPreference } from "@/types";
import { cn } from "@/lib/utils";
import {
  Salad,
  Sparkles,
  Loader2,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Utensils,
  RefreshCw,
  Pencil,
  Lightbulb,
  Clock,
  AlertCircle,
} from "lucide-react";

const PREFERENCES: { id: DietPreference; label: string }[] = [
  { id: "omnivore", label: "Omnivore" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "keto", label: "Keto" },
  { id: "paleo", label: "Paleo" },
  { id: "mediterranean", label: "Mediterranean" },
];

function defaultInput(): DietPlanInput {
  const p = getUserProfile();
  const weight = p?.weight ?? 160;
  const height = p?.height ?? 68;
  const age = p?.age ?? 30;
  const gender = p?.gender ?? "other";
  const activityLevel = p?.activityLevel ?? "moderate";
  const weightGoal = p?.weightGoal ?? "maintain";
  const calorieTarget =
    p?.calorieGoal ||
    calculateRecommendedCalories(weight, height, age, gender, activityLevel, weightGoal);

  return {
    weight,
    height,
    age,
    gender,
    activityLevel,
    weightGoal,
    calorieTarget,
    preference: "omnivore",
    mealsPerDay: 3,
    allergies: "",
    cuisines: "",
    notes: "",
  };
}

export default function DietPage() {
  const [input, setInput] = useState<DietPlanInput>(defaultInput);
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);

  useEffect(() => {
    const saved = getDietPlan();
    if (saved) {
      setPlan(saved);
      setInput(saved.input);
      setEditing(false);
    }
  }, []);

  const update = <K extends keyof DietPlanInput>(key: K, value: DietPlanInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDietPlan(input);
      setPlan(result);
      saveDietPlan(result);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] has-bottom-nav">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/15">
            <Salad className="h-5 w-5 text-emerald-400" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">AI Diet Plan</h1>
            <p className="text-xs text-zinc-500">
              A personalized daily meal plan for your body and goals
            </p>
          </div>
        </div>

        {editing ? (
          <DietQuestionnaire
            input={input}
            update={update}
            onGenerate={generate}
            loading={loading}
            error={error}
            hasPlan={!!plan}
            onCancel={plan ? () => setEditing(false) : undefined}
          />
        ) : plan ? (
          <DietPlanView
            plan={plan}
            onEdit={() => setEditing(true)}
            onRegenerate={generate}
            loading={loading}
          />
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Questionnaire
// ─────────────────────────────────────────────────────────────

function DietQuestionnaire({
  input,
  update,
  onGenerate,
  loading,
  error,
  hasPlan,
  onCancel,
}: {
  input: DietPlanInput;
  update: <K extends keyof DietPlanInput>(key: K, value: DietPlanInput[K]) => void;
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
  hasPlan: boolean;
  onCancel?: () => void;
}) {
  const ft = Math.floor(input.height / 12);
  const inch = Math.round(input.height % 12);

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 space-y-5">
        <SectionLabel>About you</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Weight (lbs)">
            <NumberInput value={input.weight} min={60} max={700} onChange={(v) => update("weight", v)} />
          </Field>
          <Field label="Age">
            <NumberInput value={input.age} min={13} max={100} onChange={(v) => update("age", v)} />
          </Field>
          <Field label="Height (ft)">
            <NumberInput value={ft} min={3} max={8} onChange={(v) => update("height", v * 12 + inch)} />
          </Field>
          <Field label="Height (in)">
            <NumberInput value={inch} min={0} max={11} onChange={(v) => update("height", ft * 12 + v)} />
          </Field>
        </div>

        <Field label="Sex">
          <SegmentedControl
            options={[
              { id: "male", label: "Male" },
              { id: "female", label: "Female" },
              { id: "other", label: "Other" },
            ]}
            value={input.gender}
            onChange={(v) => update("gender", v as DietPlanInput["gender"])}
          />
        </Field>

        <Field label="Activity level">
          <SegmentedControl
            options={[
              { id: "sedentary", label: "Sedentary" },
              { id: "light", label: "Light" },
              { id: "moderate", label: "Moderate" },
              { id: "active", label: "Active" },
              { id: "very_active", label: "Very" },
            ]}
            value={input.activityLevel}
            onChange={(v) => update("activityLevel", v as DietPlanInput["activityLevel"])}
          />
        </Field>
      </GlassCard>

      <GlassCard className="p-5 space-y-5">
        <SectionLabel>Your goal</SectionLabel>
        <Field label="I want to">
          <SegmentedControl
            options={[
              { id: "lose", label: "Lose fat" },
              { id: "maintain", label: "Maintain" },
              { id: "gain", label: "Build muscle" },
            ]}
            value={input.weightGoal}
            onChange={(v) => update("weightGoal", v as DietPlanInput["weightGoal"])}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Daily calorie target">
            <NumberInput
              value={input.calorieTarget}
              min={1000}
              max={6000}
              step={50}
              onChange={(v) => update("calorieTarget", v)}
            />
          </Field>
          <Field label="Meals per day">
            <SegmentedControl
              options={[
                { id: "2", label: "2" },
                { id: "3", label: "3" },
                { id: "4", label: "4" },
                { id: "5", label: "5" },
              ]}
              value={String(input.mealsPerDay)}
              onChange={(v) => update("mealsPerDay", parseInt(v, 10))}
            />
          </Field>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-5">
        <SectionLabel>Food preferences</SectionLabel>
        <Field label="Diet style">
          <div className="flex flex-wrap gap-1.5">
            {PREFERENCES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => update("preference", p.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors min-h-[34px]",
                  input.preference === p.id
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "border-white/[0.08] text-zinc-400 hover:text-zinc-200",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Allergies / foods to avoid">
          <TextInput
            value={input.allergies}
            placeholder="e.g. peanuts, shellfish, dairy"
            onChange={(v) => update("allergies", v)}
          />
        </Field>
        <Field label="Preferred cuisines (optional)">
          <TextInput
            value={input.cuisines}
            placeholder="e.g. Indian, Mediterranean"
            onChange={(v) => update("cuisines", v)}
          />
        </Field>
        <Field label="Anything else? (optional)">
          <TextInput
            value={input.notes}
            placeholder="e.g. high protein, quick meals, budget-friendly"
            onChange={(v) => update("notes", v)}
          />
        </Field>
      </GlassCard>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
            Cancel
          </Button>
        )}
        <GradientButton onClick={onGenerate} disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Building your plan…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> {hasPlan ? "Regenerate plan" : "Generate my plan"}
            </>
          )}
        </GradientButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Plan view
// ─────────────────────────────────────────────────────────────

function DietPlanView({
  plan,
  onEdit,
  onRegenerate,
  loading,
}: {
  plan: DietPlan;
  onEdit: () => void;
  onRegenerate: () => void;
  loading: boolean;
}) {
  const macroCals = useMemo(
    () => ({
      protein: plan.macros.protein * 4,
      carbs: plan.macros.carbs * 4,
      fat: plan.macros.fat * 9,
    }),
    [plan.macros],
  );
  const totalMacroCals = macroCals.protein + macroCals.carbs + macroCals.fat || 1;

  return (
    <div className="space-y-4">
      <GlassCard elevated className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-tight">{plan.title}</h2>
            <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{plan.summary}</p>
          </div>
          {plan.source === "fallback" && (
            <span className="shrink-0 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
              Basic
            </span>
          )}
        </div>

        {/* Calories + macros */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          <MacroStat icon={<Flame className="h-4 w-4" />} label="Calories" value={plan.dailyCalories} tint="text-cyan-300" />
          <MacroStat icon={<Beef className="h-4 w-4" />} label="Protein" value={`${plan.macros.protein}g`} tint="text-rose-300" />
          <MacroStat icon={<Wheat className="h-4 w-4" />} label="Carbs" value={`${plan.macros.carbs}g`} tint="text-amber-300" />
          <MacroStat icon={<Droplets className="h-4 w-4" />} label="Fat" value={`${plan.macros.fat}g`} tint="text-emerald-300" />
        </div>

        {/* Macro split bar */}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05] flex">
          <div className="h-full bg-rose-400/80" style={{ width: `${(macroCals.protein / totalMacroCals) * 100}%` }} />
          <div className="h-full bg-amber-400/80" style={{ width: `${(macroCals.carbs / totalMacroCals) * 100}%` }} />
          <div className="h-full bg-emerald-400/80" style={{ width: `${(macroCals.fat / totalMacroCals) * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
          <span>Protein {Math.round((macroCals.protein / totalMacroCals) * 100)}%</span>
          <span>Carbs {Math.round((macroCals.carbs / totalMacroCals) * 100)}%</span>
          <span>Fat {Math.round((macroCals.fat / totalMacroCals) * 100)}%</span>
        </div>
      </GlassCard>

      {/* Meals */}
      {plan.meals.length > 0 && (
        <div className="space-y-3">
          {plan.meals.map((meal, i) => (
            <GlassCard key={i} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-zinc-100">{meal.meal}</h3>
                  {meal.time && (
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Clock className="h-3 w-3" /> {meal.time}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold tabular-nums text-cyan-300">{meal.calories} cal</span>
              </div>
              <div className="space-y-2">
                {meal.items.map((item, j) => (
                  <div key={j} className="flex items-start justify-between gap-3 rounded-lg bg-white/[0.02] px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm text-zinc-200 truncate">{item.name}</div>
                      <div className="text-[11px] text-zinc-500">{item.portion}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold tabular-nums text-zinc-300">{item.calories} cal</div>
                      <div className="text-[10px] text-zinc-600 tabular-nums">
                        P{item.protein} C{item.carbs} F{item.fat}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Tips + hydration */}
      {(plan.tips.length > 0 || plan.hydrationLiters) && (
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-100">Coach tips</h3>
          </div>
          <ul className="space-y-2">
            {plan.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/70" />
                {tip}
              </li>
            ))}
          </ul>
          {plan.hydrationLiters ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/15 px-4 py-3 text-sm text-cyan-200">
              <Droplets className="h-4 w-4 shrink-0" />
              Drink about {plan.hydrationLiters} L of water per day
            </div>
          ) : null}
        </GlassCard>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onEdit} className="flex-1" disabled={loading}>
          <Pencil className="h-4 w-4" /> Edit answers
        </Button>
        <GradientButton onClick={onRegenerate} disabled={loading} className="flex-1">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Regenerate
        </GradientButton>
      </div>

      <p className="text-center text-[10px] text-zinc-600 px-6">
        AI-generated guidance for general wellness — not medical advice. Consult a professional for specific dietary needs.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small UI primitives
// ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">{children}</div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
      }}
      className="w-full h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 text-sm text-zinc-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
    />
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors min-h-[34px]",
            value === o.id ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MacroStat({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tint: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 text-center">
      <div className={cn("flex justify-center mb-1", tint)}>{icon}</div>
      <div className="text-base font-black tabular-nums text-zinc-100">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  );
}
