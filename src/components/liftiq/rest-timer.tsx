"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, SkipForward, Timer } from "lucide-react";
import { fmtClock } from "@/lib/liftiq/demo-data";
import { Button, Ring } from "./primitives";

export type RestState = { id: number; total: number; exercise: string } | null;

function TimerCard({
  total: initialTotal,
  exercise,
  onDismiss,
}: {
  total: number;
  exercise: string;
  onDismiss: () => void;
}) {
  const [total, setTotal] = useState(initialTotal);
  const [remaining, setRemaining] = useState(initialTotal);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Auto-dismiss shortly after the interval completes.
  useEffect(() => {
    if (remaining !== 0) return;
    const id = window.setTimeout(onDismiss, 1400);
    return () => window.clearTimeout(id);
  }, [remaining, onDismiss]);

  const done = remaining === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.3, 1] }}
      className="fixed bottom-24 left-4 right-4 z-50 min-[960px]:bottom-6 min-[960px]:left-auto min-[960px]:right-6 min-[960px]:w-[330px]"
    >
      <div className="liq-elev flex items-center gap-4 p-4 shadow-2xl">
        <Ring
          value={total - remaining}
          max={total}
          size={64}
          stroke={5}
          color={done ? "#b6f23a" : "#f7f7f8"}
          animate={false}
        >
          <Timer size={16} className={done ? "text-[#b6f23a]" : "text-[#9ca3af]"} />
        </Ring>

        <div className="min-w-0 flex-1">
          <p className="liq-eyebrow">{done ? "Rest Complete" : "Rest Timer"}</p>
          <p className="liq-num mt-0.5 text-[26px] font-semibold leading-none liq-t1">
            {fmtClock(remaining)}
          </p>
          <p className="mt-1 truncate text-[11.5px] liq-t3">{exercise}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            title="Add 30 seconds"
            onClick={() => {
              setRemaining((r) => r + 30);
              setTotal((t) => t + 30);
            }}
          >
            <Plus size={12} />
            30s
          </Button>
          <Button size="sm" variant="quiet" onClick={onDismiss} title="Skip rest">
            <SkipForward size={12} />
            Skip
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Floating rest countdown. Appears when a set is completed; each rest interval
 * mounts a fresh card so the countdown always starts from the prescription.
 */
export function RestTimer({ state, onDismiss }: { state: RestState; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {state && (
        <TimerCard
          key={state.id}
          total={state.total}
          exercise={state.exercise}
          onDismiss={onDismiss}
        />
      )}
    </AnimatePresence>
  );
}
