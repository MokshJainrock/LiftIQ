"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoggedSet } from "@/lib/liftiq/demo-data";

export type SetPatch = Partial<Pick<LoggedSet, "weight" | "reps" | "rpe">>;

function NumberField({
  value,
  placeholder,
  onChange,
  ariaLabel,
  step = 5,
  size = "sm",
  disabled,
}: {
  value: number | null;
  placeholder: string;
  onChange: (v: number | null) => void;
  ariaLabel: string;
  step?: number;
  size?: "sm" | "lg";
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      disabled={disabled}
      aria-label={ariaLabel}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={cn(
        "liq-num w-full rounded-lg border border-white/[0.07] bg-white/[0.03] text-center font-semibold liq-t1 transition-colors duration-150",
        "placeholder:font-normal placeholder:text-[#4b5058]",
        "hover:border-white/[0.14] focus:border-[#b6f23a]/45 focus:bg-white/[0.05] focus:outline-none",
        "disabled:opacity-50",
        size === "lg" ? "h-14 text-[22px]" : "h-9 text-[13px]"
      )}
    />
  );
}

/** Desktop set row inside the exercise table. */
export function ExerciseSetRow({
  index,
  set,
  onPatch,
  onComplete,
}: {
  index: number;
  set: LoggedSet;
  onPatch: (patch: SetPatch) => void;
  onComplete: () => void;
}) {
  const done = set.status === "done";
  const active = set.status === "active";
  const upcoming = set.status === "upcoming";

  return (
    <tr
      className={cn(
        "border-t border-white/[0.05] transition-colors duration-150",
        active && "bg-[#b6f23a]/[0.035]"
      )}
    >
      <td className="py-2.5 pl-1 pr-2">
        <span
          className={cn(
            "liq-num flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-semibold",
            done
              ? "bg-white/[0.05] liq-t2"
              : active
                ? "bg-[#b6f23a]/14 text-[#b6f23a]"
                : "bg-white/[0.03] liq-t3"
          )}
        >
          {index + 1}
        </span>
      </td>

      <td className="px-2 py-2.5">
        <span className="liq-num text-[12.5px] liq-t3">{set.previous ?? "—"}</span>
      </td>

      <td className="w-[86px] px-2 py-2.5">
        <NumberField
          value={set.weight}
          placeholder="—"
          ariaLabel={`Set ${index + 1} weight`}
          onChange={(v) => onPatch({ weight: v })}
          disabled={upcoming && !set.previous}
        />
      </td>

      <td className="w-[70px] px-2 py-2.5">
        <NumberField
          value={set.reps}
          placeholder="—"
          step={1}
          ariaLabel={`Set ${index + 1} reps`}
          onChange={(v) => onPatch({ reps: v })}
        />
      </td>

      <td className="w-[70px] px-2 py-2.5">
        <NumberField
          value={set.rpe}
          placeholder="—"
          step={0.5}
          ariaLabel={`Set ${index + 1} RPE`}
          onChange={(v) => onPatch({ rpe: v })}
        />
      </td>

      <td className="py-2.5 pl-2 pr-1 text-right">
        {done ? (
          <span className="liq-check-in inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#b6f23a]/14 text-[#b6f23a]">
            <Check size={15} strokeWidth={3} />
          </span>
        ) : (
          <button
            onClick={onComplete}
            disabled={set.weight === null || set.reps === null}
            aria-label={`Complete set ${index + 1}`}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150",
              "disabled:cursor-not-allowed disabled:opacity-35",
              active
                ? "border-[#b6f23a]/40 text-[#b6f23a] hover:bg-[#b6f23a]/12"
                : "border-white/[0.09] text-[#6b7280] hover:border-white/20 hover:text-[#9ca3af]"
            )}
          >
            <Check size={15} strokeWidth={2.5} />
          </button>
        )}
      </td>
    </tr>
  );
}

/**
 * Mobile set card — thumb-sized inputs and a full-width completion button so
 * the whole set can be logged one-handed.
 */
export function ExerciseSetCard({
  index,
  set,
  onPatch,
  onComplete,
}: {
  index: number;
  set: LoggedSet;
  onPatch: (patch: SetPatch) => void;
  onComplete: () => void;
}) {
  const done = set.status === "done";

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 transition-colors duration-150",
        done
          ? "border-white/[0.06] bg-white/[0.015]"
          : set.status === "active"
            ? "border-[#b6f23a]/25 bg-[#b6f23a]/[0.035]"
            : "border-white/[0.07] bg-white/[0.02]"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="liq-eyebrow">Set {index + 1}</span>
        <span className="liq-num text-[11.5px] liq-t3">
          Previous {set.previous ?? "—"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        <div>
          <label className="mb-1.5 block text-[11px] liq-t3">Weight</label>
          <NumberField
            size="lg"
            value={set.weight}
            placeholder="—"
            ariaLabel={`Set ${index + 1} weight`}
            onChange={(v) => onPatch({ weight: v })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] liq-t3">Reps</label>
          <NumberField
            size="lg"
            step={1}
            value={set.reps}
            placeholder="—"
            ariaLabel={`Set ${index + 1} reps`}
            onChange={(v) => onPatch({ reps: v })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] liq-t3">RPE</label>
          <NumberField
            size="lg"
            step={0.5}
            value={set.rpe}
            placeholder="—"
            ariaLabel={`Set ${index + 1} RPE`}
            onChange={(v) => onPatch({ rpe: v })}
          />
        </div>
      </div>

      {done ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-[10px] bg-[#b6f23a]/[0.08] py-2.5 text-[13px] font-semibold text-[#b6f23a]">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.3, 1] }}
            className="inline-flex"
          >
            <Check size={15} strokeWidth={3} />
          </motion.span>
          Set Complete
        </div>
      ) : (
        <button
          onClick={onComplete}
          disabled={set.weight === null || set.reps === null}
          className="liq-btn-accent mt-3 h-11 w-full rounded-[10px] text-[13.5px] font-semibold disabled:pointer-events-none disabled:opacity-40"
        >
          Complete Set
        </button>
      )}
    </div>
  );
}
