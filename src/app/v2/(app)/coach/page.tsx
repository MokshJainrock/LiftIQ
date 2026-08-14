"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import {
  COACH_INSIGHTS,
  COACH_THREAD,
  LIFTS,
  MUSCLE_VOLUME,
  RECOVERY,
  SUGGESTED_PROMPTS,
  USER,
  WEEKLY_VOLUME,
  fmtNum,
} from "@/lib/liftiq/demo-data";
import { AIInsight } from "@/components/liftiq/ai-insight";
import { LiftIQMark } from "@/components/liftiq/logo";
import { Card, CardHeader, PageHeader, Reveal, Sparkline } from "@/components/liftiq/primitives";

type Message = {
  id: string;
  role: "user" | "coach";
  content: string;
  points?: string[];
  recommendation?: string;
  chart?: { week: string; e1rm: number; rpe: number }[];
};

const INITIAL: Message[] = [
  { id: "m1", role: "user", content: COACH_THREAD[0].content },
  {
    id: "m2",
    role: "coach",
    content: COACH_THREAD[1].content,
    points: COACH_THREAD[1].points,
    recommendation: COACH_THREAD[1].recommendation,
    chart: COACH_THREAD[1].chart,
  },
];

/** Canned answers keyed to the suggested prompts so the demo reads coherently. */
const ANSWERS: Record<string, Omit<Message, "id" | "role">> = {
  "What weight should I bench today?": {
    content:
      "Work up to 235 lb for your top set of five. That is a 5 lb increase on last session, which you completed at RPE 8 with two reps in reserve on the first set.",
    points: [
      "Warm-up: 135 × 5, 185 × 3, 215 × 1.",
      "Working sets: 235 × 5, 235 × 5, 230 × 5, 230 × 5.",
      "Stop the set if bar speed drops below your RPE 9 threshold.",
    ],
    recommendation:
      "If all four sets land at RPE 8 or below, add another 5 lb next session. If the last set exceeds RPE 9.5, repeat 235 lb.",
  },
  "Am I training chest enough?": {
    content:
      "Yes. Chest is at 16 working sets per week, which sits exactly in your target range for an intermediate lifter at your bodyweight.",
    points: [
      "Chest: 16 sets — optimal.",
      "Two sessions per week, which is the frequency associated with your best progression.",
      "Bench estimated 1RM is up 19.5% over six months.",
    ],
    recommendation:
      "Hold chest volume where it is. Your available recovery is better spent closing the hamstring and quad gaps.",
  },
  "Why has my squat stalled?": {
    content:
      "Your squat is not actually stalled — it is progressing at 8.3 lb per month, which is normal for your training age. What has stalled is quad volume.",
    points: [
      "Quads: 12 sets against a 16-set target.",
      "Squat estimated 1RM moved 300 → 315 lb over the last six weeks.",
      "You have not performed a front squat variation in three weeks.",
    ],
    recommendation:
      "Add four quad-focused sets per week, split between leg press and front squats, before changing your main squat progression.",
  },
  "Should I deload next week?": {
    content:
      "Not yet. Your recovery score is 76% and your average session RPE is 8.2, both inside the range where continued overload is productive.",
    points: [
      "Recovery: 76% — ready to train.",
      "Training load: moderate.",
      "Week 6 of 12 in your current block.",
    ],
    recommendation:
      "Plan the deload for week 8, immediately after your next heavy bench and deadlift test.",
  },
  "Build me a 4-day strength program.": {
    content:
      "Your current Upper/Lower split is already the right structure. Here is the four-day version built around your four main lifts.",
    points: [
      "Day 1 — Upper Strength: bench 4×5, weighted pull-up 4×6, shoulder press 3×6.",
      "Day 2 — Lower Strength: squat 4×5, Romanian deadlift 3×8, leg press 3×10.",
      "Day 4 — Upper Hypertrophy: incline press 4×8, row 4×10, lateral raise 4×12.",
      "Day 6 — Lower Hypertrophy: deadlift 3×5, leg curl 4×12, calf raise 4×15.",
    ],
    recommendation:
      "Progress the strength days with 5 lb per week and the hypertrophy days by adding a rep before adding load.",
  },
  "Analyze my last 30 days.": {
    content:
      "A strong month. Volume, strength score and consistency all moved in the right direction, with one clear gap.",
    points: [
      `Volume: ${fmtNum(WEEKLY_VOLUME.total)} lb this week, up ${WEEKLY_VOLUME.deltaPct}%.`,
      "Strength score: 782, up 24 points.",
      "Seven personal records across four lifts.",
      "Hamstring volume 22% below target — the only metric outside range.",
    ],
    recommendation:
      "Keep everything as prescribed and add two Romanian deadlift sets per week for the next block.",
  },
};

const FALLBACK: Omit<Message, "id" | "role"> = {
  content:
    "Based on your last 30 days, your training is progressing well and the highest-leverage change is lower-body volume.",
  points: [
    `Recovery is at ${RECOVERY.score}% and your load is moderate.`,
    "Chest, back, shoulders and triceps are all in their target ranges.",
    "Quads and hamstrings are 4 sets per week below target.",
  ],
  recommendation:
    "Add one squat-pattern and one hinge accessory to your lower-body day, then reassess in two weeks.",
};

function EmbeddedChart({ data }: { data: { week: string; e1rm: number; rpe: number }[] }) {
  return (
    <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="liq-eyebrow mb-2">Estimated 1RM</p>
          <div className="flex items-end gap-3">
            <Sparkline data={data.map((d) => d.e1rm)} width={110} height={34} color="#9ca3af" />
            <span className="liq-num text-[15px] font-semibold liq-t1">
              {data[data.length - 1].e1rm} lb
            </span>
          </div>
        </div>
        <div>
          <p className="liq-eyebrow mb-2">Average RPE</p>
          <div className="flex items-end gap-3">
            <Sparkline data={data.map((d) => d.rpe)} width={110} height={34} color="#e0655f" />
            <span className="liq-num text-[15px] font-semibold text-[#e0655f]">
              {data[data.length - 1].rpe}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 border-t border-white/[0.06] pt-3 text-[11.5px] liq-t3">
        Load flat while effort climbed — the signature of accumulated fatigue rather than a strength
        ceiling.
      </p>
    </div>
  );
}

function CoachMessage({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-white/[0.08] bg-white/[0.05] px-4 py-2.5 text-[13.5px] liq-t1">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.08] bg-[#191c22]">
        <LiftIQMark size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="liq-eyebrow mb-2">Lift IQ</p>
        <p className="text-[13.5px] leading-relaxed liq-t1">{message.content}</p>

        {message.points && (
          <ol className="mt-3 space-y-2">
            {message.points.map((p, i) => (
              <li key={p} className="flex gap-3">
                <span className="liq-num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.05] text-[10.5px] font-semibold liq-t2">
                  {i + 1}
                </span>
                <span className="text-[13px] leading-relaxed liq-t2">{p}</span>
              </li>
            ))}
          </ol>
        )}

        {message.chart && <EmbeddedChart data={message.chart} />}

        {message.recommendation && (
          <div className="mt-4 border-l-2 border-[#b6f23a] pl-3.5">
            <p className="liq-eyebrow mb-1">Recommendation</p>
            <p className="text-[13px] leading-relaxed liq-t1">{message.recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const counter = useRef(0);

  const ask = useCallback((question: string) => {
    const q = question.trim();
    if (!q || thinking) return;

    counter.current += 1;
    const id = counter.current;
    setMessages((prev) => [...prev, { id: `u${id}`, role: "user", content: q }]);
    setInput("");
    setThinking(true);

    window.setTimeout(() => {
      const answer = ANSWERS[q] ?? FALLBACK;
      setMessages((prev) => [...prev, { id: `c${id}`, role: "coach", ...answer }]);
      setThinking(false);
    }, 700);
  }, [thinking]);

  const context = [
    { label: "Recovery", value: `${RECOVERY.score}%` },
    { label: "Weekly volume", value: `${fmtNum(WEEKLY_VOLUME.total)} lb` },
    { label: "Streak", value: `${USER.streak} days` },
    { label: "Bench 1RM", value: `${LIFTS.bench.current} lb` },
    { label: "Squat 1RM", value: `${LIFTS.squat.current} lb` },
    { label: "Sets this week", value: String(MUSCLE_VOLUME.reduce((n, m) => n + m.sets, 0)) },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader
          title="Lift IQ Coach"
          subtitle="Training intelligence based on your workout history."
        />
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Reveal delay={0.04}>
            <Card className="flex flex-col">
              {/* Thread */}
              <div className="space-y-7 p-5 md:p-6">
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: [0.2, 0.8, 0.3, 1] }}
                  >
                    <CoachMessage message={m} />
                  </motion.div>
                ))}

                <AnimatePresence>
                  {thinking && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 text-[12.5px] liq-t3"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/[0.08] bg-[#191c22]">
                        <LiftIQMark size={16} />
                      </span>
                      <span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-[#6b7280]"
                            animate={{ opacity: [0.25, 1, 0.25] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </span>
                      Analysing your training history
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Composer */}
              <div className="border-t border-white/[0.06] p-4 md:p-5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask(input);
                  }}
                  className="relative"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your training…"
                    className="h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] pl-4 pr-12 text-[13.5px] liq-t1 transition-colors duration-150 placeholder:text-[#6b7280] hover:border-white/[0.13] focus:border-[#b6f23a]/40 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || thinking}
                    aria-label="Send"
                    className="liq-btn-accent absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg disabled:pointer-events-none disabled:opacity-35"
                  >
                    <ArrowUp size={16} />
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => ask(p)}
                      disabled={thinking}
                      className="rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-[12px] liq-t2 transition-colors duration-150 hover:border-[#b6f23a]/30 hover:bg-[#b6f23a]/[0.05] hover:text-[#f7f7f8] disabled:opacity-45"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </Reveal>
        </div>

        {/* Context rail */}
        <div className="space-y-4">
          <Reveal delay={0.08}>
            <Card className="p-5">
              <CardHeader
                title="Training Context"
                subtitle="What the coach reads before answering"
                eyebrow="Live data"
              />
              <dl className="mt-4 divide-y divide-white/[0.05]">
                {context.map((c) => (
                  <div key={c.label} className="flex items-center justify-between py-2.5">
                    <dt className="text-[12.5px] liq-t2">{c.label}</dt>
                    <dd className="liq-num text-[13px] font-semibold liq-t1">{c.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="space-y-3">
              <p className="liq-eyebrow flex items-center gap-1.5">
                <Sparkles size={12} />
                Proactive Insights
              </p>
              {COACH_INSIGHTS.map((insight) => (
                <AIInsight
                  key={insight.title}
                  title={insight.title}
                  body={insight.body}
                  tone={insight.tone}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
