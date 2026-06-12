"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ExerciseDemoPlayer, preloadExerciseDemo } from "@/components/exercise-guide/exercise-demo-player";
import { AnimatedSkeleton } from "@/components/exercise-guide/animated-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  Footprints,
  MessageCircle,
  Crosshair,
  Play,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LibraryExercise } from "@/lib/exercises/library";
import { EQUIPMENT_LABELS } from "@/lib/exercises/library";
import { resolveExerciseDemo } from "@/lib/exercises/exercise-demo-map";
import { resolveExerciseGif } from "@/lib/exercises/exercise-gif";
import type { ExerciseVisualGuide } from "@/lib/exercises/exercise-visual-guides";

type Tab = "steps" | "mistakes" | "cues" | "focus";

interface ExerciseDetailModalProps {
  exercise: LibraryExercise;
  onClose: () => void;
}

function enrichGuide(guide: ExerciseVisualGuide, instructions?: string[]): ExerciseVisualGuide {
  if (!instructions?.length) return guide;
  const steps = instructions.map((line, i) => {
    const cleaned = line.replace(/^Step:\s*\d+\s*/i, "").trim();
    const dot = cleaned.indexOf(". ");
    if (dot > 0 && dot < 40) {
      return { title: cleaned.slice(0, dot), detail: cleaned.slice(dot + 2) };
    }
    return { title: `Step ${i + 1}`, detail: cleaned };
  });
  return { ...guide, steps };
}

export function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("steps");

  const gif = useMemo(() => resolveExerciseGif(exercise.id, exercise.name), [exercise.id, exercise.name]);
  const { guide: rawGuide, spec } = useMemo(
    () => resolveExerciseDemo(exercise.id, exercise.name),
    [exercise.id, exercise.name],
  );
  const guide = useMemo(
    () => enrichGuide(rawGuide, gif?.instructions),
    [rawGuide, gif?.instructions],
  );

  useEffect(() => {
    if (gif) preloadExerciseDemo(gif.videoUrl, gif.gifUrl);
  }, [gif]);

  const isFrontOnly = !!guide.keyframes[0]?.leftShoulder;
  const skeletonView =
    (spec.preferFront || isFrontOnly) && (guide.frontKeyframes?.length || isFrontOnly) ? "front" : "side";

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "steps", label: "Steps", icon: <Footprints className="h-3.5 w-3.5" /> },
    { id: "focus", label: "Focus", icon: <Crosshair className="h-3.5 w-3.5" /> },
    { id: "mistakes", label: "Mistakes", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { id: "cues", label: "Cues", icon: <MessageCircle className="h-3.5 w-3.5" /> },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-2xl my-4 sm:my-8 mx-4"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard elevated className="rounded-3xl overflow-hidden">
            <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/10 flex items-center justify-center">
                      <Dumbbell className="h-4.5 w-4.5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight">{exercise.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border text-zinc-400 bg-white/[0.03] border-white/[0.08]">
                          {EQUIPMENT_LABELS[exercise.equipment]}
                        </Badge>
                        <span className="text-[11px] text-zinc-500">Rest {exercise.defaultRestSec}s</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">{exercise.cue}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white/[0.06] text-zinc-500 transition-colors shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative rounded-2xl bg-[#050508] border border-white/[0.04] overflow-hidden mb-5">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none z-10" />
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full">
                  {gif?.gifUrl || gif?.videoUrl ? (
                    <ExerciseDemoPlayer
                      videoSrc={gif.videoUrl}
                      gifSrc={gif.gifUrl}
                      showControls
                      autoplay
                      className="absolute inset-0"
                    />
                  ) : (
                    <AnimatedSkeleton guide={guide} demoSpec={spec} ghost view={skeletonView} showControls />
                  )}
                </div>
                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {gif ? "Human demo" : `${skeletonView} view`}
                  </span>
                </div>
              </div>

              <div className="flex gap-1 rounded-xl bg-white/[0.02] border border-white/[0.04] p-1 mb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition-all",
                      activeTab === tab.id
                        ? "bg-white/[0.06] text-zinc-100 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]",
                    )}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="mb-5 max-h-[40vh] overflow-y-auto"
                >
                  {activeTab === "steps" && <StepsPanel steps={guide.steps} />}
                  {activeTab === "focus" && (
                    <FocusPanel focusAreas={guide.focusAreas} highlightJoints={guide.highlightJoints} />
                  )}
                  {activeTab === "mistakes" && <MistakesPanel mistakes={guide.commonMistakes} />}
                  {activeTab === "cues" && <CuesPanel cues={guide.coachingCues.length ? guide.coachingCues : [exercise.cue]} />}
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-2">
                <Link
                  href={`/workout/live?exercise=${exercise.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25 px-4 py-3 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20 transition-colors min-h-[48px]"
                >
                  <Play className="h-4 w-4" /> Start workout
                </Link>
                {exercise.trackingId && (
                  <Link
                    href={`/workout?exercise=${exercise.trackingId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors min-h-[48px]"
                    title="Train with camera form analysis"
                  >
                    <Camera className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StepsPanel({ steps }: { steps: ExerciseVisualGuide["steps"] }) {
  if (!steps.length) {
    return <p className="text-sm text-zinc-500 px-1">No step-by-step guide available yet.</p>;
  }
  return (
    <div className="space-y-2.5">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 glass-card rounded-xl px-4 py-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/15 text-cyan-400 text-xs font-black">
            {i + 1}
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-200 mb-0.5">{step.title}</div>
            <div className="text-xs text-zinc-500 leading-relaxed">{step.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const JOINT_ICONS: Record<string, string> = {
  hip: "🦴", frontKnee: "🦵", backKnee: "🦵", shoulder: "💪", elbow: "💪", hand: "✋",
};

function FocusPanel({
  focusAreas,
  highlightJoints,
}: {
  focusAreas: ExerciseVisualGuide["focusAreas"];
  highlightJoints: string[];
}) {
  if (!focusAreas.length) {
    return <p className="text-sm text-zinc-500 px-1">Watch your form throughout the full range of motion.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {focusAreas.map((area, i) => {
          const isPrimary = highlightJoints.includes(area.joint);
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3.5 py-3 border",
                isPrimary ? "bg-blue-500/[0.08] border-blue-500/20" : "glass-card border-white/[0.04]",
              )}
            >
              <span className="text-base">{JOINT_ICONS[area.joint] || "🎯"}</span>
              <div className="text-sm font-bold text-zinc-300">{area.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MistakesPanel({ mistakes }: { mistakes: ExerciseVisualGuide["commonMistakes"] }) {
  if (!mistakes.length) {
    return <p className="text-sm text-zinc-500 px-1">Use controlled reps and full range of motion.</p>;
  }
  return (
    <div className="space-y-2.5">
      {mistakes.map((m, i) => (
        <GlassCard key={i} className="p-0 overflow-hidden">
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="h-6 w-6 rounded-md bg-rose-500/10 border border-rose-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-3 w-3 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-rose-300 mb-1">{m.mistake}</div>
              <div className="flex items-start gap-2 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/10 px-3 py-2">
                <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-300/90 leading-relaxed">{m.fix}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function CuesPanel({ cues }: { cues: string[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {cues.map((cue, i) => (
        <div key={i} className="flex items-center gap-2.5 glass-card rounded-xl px-4 py-3">
          <MessageCircle className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span className="text-sm font-medium text-zinc-300">{cue}</span>
        </div>
      ))}
    </div>
  );
}
