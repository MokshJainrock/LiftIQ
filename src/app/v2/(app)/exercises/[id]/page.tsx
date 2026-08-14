"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Dumbbell, Play } from "lucide-react";
import { exerciseDetail, fmtNum } from "@/lib/liftiq/demo-data";
import { href } from "@/components/liftiq/nav-config";
import { ProgressChart } from "@/components/liftiq/progress-chart";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Pill,
  Reveal,
  Segmented,
} from "@/components/liftiq/primitives";

const TABS = ["History", "Performance", "Technique"] as const;
type Tab = (typeof TABS)[number];

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("History");
  const detail = exerciseDetail(params.id);

  if (!detail) {
    return (
      <Card>
        <EmptyState
          icon={<Dumbbell size={20} />}
          title="Exercise not found"
          body="This movement isn't in your library yet."
          action={
            <Link href={href("/exercises")}>
              <Button variant="ghost">Back to library</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const stats = [
    { label: "Estimated 1RM", value: detail.estimated1RM },
    { label: "Best Set", value: detail.bestSet },
    { label: "Lifetime Volume", value: `${fmtNum(detail.lifetimeVolume)} lb` },
    { label: "Sessions", value: String(detail.sessions) },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <Link
            href={href("/exercises")}
            className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] liq-t3 transition-colors duration-150 hover:text-[#f7f7f8]"
          >
            <ArrowLeft size={14} />
            Back to Exercises
          </Link>

          <PageHeader
            title={detail.name}
            actions={
              <Link href={href("/train")}>
                <Button variant="accent">
                  <Play size={15} />
                  Log Exercise
                </Button>
              </Link>
            }
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill tone="accent">{detail.movement}</Pill>
            <Pill>{detail.equipment}</Pill>
            <Pill>{detail.difficulty}</Pill>
            <span className="text-[12.5px] liq-t3">
              Primary <span className="liq-t1">{detail.primary.join(", ")}</span>
              {detail.secondary.length > 0 && (
                <>
                  {" · "}Secondary <span className="liq-t2">{detail.secondary.join(", ")}</span>
                </>
              )}
            </span>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={0.04 + i * 0.03}>
            <Card className="p-5">
              <p className="liq-eyebrow">{s.label}</p>
              <p className="liq-num mt-2 text-[24px] font-semibold leading-none liq-t1">{s.value}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.16}>
        <Segmented options={TABS} value={tab} onChange={setTab} />
      </Reveal>

      {tab === "History" && (
        <Reveal delay={0.2}>
          <Card className="p-5 md:p-6">
            <CardHeader title="Session History" subtitle="Your last six sessions on this movement" />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[440px]">
                <thead>
                  <tr className="text-left">
                    {["Date", "Top Set", "Volume", "Est. 1RM"].map((h, i) => (
                      <th
                        key={h}
                        className={`pb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] liq-t3 ${
                          i > 0 ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.history.map((h) => (
                    <tr
                      key={h.date}
                      className="border-t border-white/[0.05] transition-colors duration-150 hover:bg-white/[0.02]"
                    >
                      <td className="py-3 text-[13px] liq-t1">{h.date}</td>
                      <td className="liq-num py-3 text-right text-[13px] liq-t1">{h.top}</td>
                      <td className="liq-num py-3 text-right text-[13px] liq-t2">
                        {h.volume ? `${fmtNum(h.volume)} lb` : "—"}
                      </td>
                      <td className="liq-num py-3 text-right text-[13px] font-semibold liq-t1">
                        {h.e1rm ? `${h.e1rm} lb` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Reveal>
      )}

      {tab === "Performance" && (
        <Reveal delay={0.2}>
          <Card className="p-5 md:p-6">
            <CardHeader
              title="Estimated 1RM Progression"
              subtitle="Derived from your top set each session"
            />
            <div className="mt-5">
              {detail.chart[0].value > 0 ? (
                <ProgressChart data={detail.chart} height={280} id={`detail-${detail.id}`} />
              ) : (
                <EmptyState
                  icon={<Dumbbell size={20} />}
                  title="No load data for this movement"
                  body="This exercise is tracked by time rather than weight, so 1RM progression doesn't apply."
                />
              )}
            </div>
          </Card>
        </Reveal>
      )}

      {tab === "Technique" && (
        <Reveal delay={0.2}>
          <Card className="p-5 md:p-6">
            <CardHeader title="Technique" subtitle="Execution standards Lift IQ scores against" />
            <ol className="mt-5 space-y-3">
              {detail.technique.map((cue, i) => (
                <li key={cue} className="flex gap-3.5">
                  <span className="liq-num flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[11px] font-semibold liq-t2">
                    {i + 1}
                  </span>
                  <p className="text-[13.5px] leading-relaxed liq-t2">{cue}</p>
                </li>
              ))}
            </ol>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
