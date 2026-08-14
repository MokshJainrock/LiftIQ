"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Camera,
  Salad,
  Sparkles,
  Target,
} from "lucide-react";
import { LiftIQLogo } from "@/components/liftiq/logo";
import { Card } from "@/components/liftiq/primitives";

const features = [
  {
    icon: Camera,
    title: "AI camera coach",
    body: "Live pose tracking, rep counting, and form scores from your browser camera.",
  },
  {
    icon: Target,
    title: "Form that gets scored",
    body: "Every rep is judged on depth, alignment, and consistency — with cues as you move.",
  },
  {
    icon: Salad,
    title: "Diet and recovery",
    body: "Log meals, check in, and keep training next to nutrition and mind tools.",
  },
  {
    icon: BarChart3,
    title: "Progress you can see",
    body: "Volume, PRs, streaks, and history in the same workspace you train in.",
  },
];

export default function LandingPage() {
  return (
    <div className="liq liq-auth-bg relative min-h-[100dvh] overflow-hidden">
      <div aria-hidden className="liq-grid-lines pointer-events-none absolute inset-0" />

      <header className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-5 md:px-8 md:py-7">
        <Link href="/" aria-label="Lift IQ home">
          <LiftIQLogo />
        </Link>
        <Link
          href="/login"
          className="text-[13.5px] font-medium text-[#b6f23a] transition-colors hover:underline"
        >
          Sign in
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-5 pb-20 md:px-8">
        <section className="grid items-center gap-12 pt-6 lg:grid-cols-2 lg:gap-16 lg:pt-10">
          <div>
            <p className="liq-eyebrow">AI form coach</p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.3, 1] }}
              className="liq-tight mt-4 text-[40px] font-semibold leading-[1.06] liq-t1 sm:text-[52px] xl:text-[56px]"
            >
              Train smarter.
              <br />
              Get stronger.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08, ease: [0.2, 0.8, 0.3, 1] }}
              className="mt-5 max-w-[460px] text-[15px] leading-relaxed liq-t2"
            >
              Intelligent strength training with a live camera coach, diet tracking,
              and recovery — built around your performance.
            </motion.p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="liq-btn-accent liq-glow inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[14px] font-semibold"
              >
                Get started
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/v2"
                className="liq-btn-ghost inline-flex h-12 items-center justify-center rounded-xl px-6 text-[14px] font-medium"
              >
                Open the app
              </Link>
            </div>

            <div className="mt-12 flex gap-10">
              {[
                { value: "Live", label: "Pose tracking" },
                { value: "100", label: "Exercise library" },
                { value: "AI", label: "Form cues" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="liq-num text-[20px] font-semibold liq-t1">{s.value}</p>
                  <p className="mt-0.5 text-[12px] liq-t3">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease: [0.2, 0.8, 0.3, 1] }}
          >
            <Card className="overflow-hidden p-2">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[12px] bg-[#0c0d10] md:aspect-[5/4]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(182,242,58,0.14),transparent_62%)]" />
                <svg
                  viewBox="0 0 200 300"
                  className="relative h-[72%] w-auto drop-shadow-[0_0_22px_rgba(182,242,58,0.35)]"
                  aria-hidden
                >
                  <circle cx="100" cy="40" r="20" fill="none" stroke="#b6f23a" strokeWidth="4" />
                  <line x1="100" y1="60" x2="100" y2="160" stroke="#b6f23a" strokeWidth="4" />
                  <line x1="100" y1="90" x2="50" y2="130" stroke="#b6f23a" strokeWidth="4" />
                  <line x1="100" y1="90" x2="150" y2="130" stroke="#b6f23a" strokeWidth="4" />
                  <line x1="100" y1="160" x2="60" y2="240" stroke="#b6f23a" strokeWidth="4" />
                  <line x1="100" y1="160" x2="140" y2="240" stroke="#e0655f" strokeWidth="4" />
                  <circle cx="100" cy="90" r="7" fill="#b6f23a" />
                  <circle cx="50" cy="130" r="7" fill="#b6f23a" />
                  <circle cx="150" cy="130" r="7" fill="#b6f23a" />
                  <circle cx="100" cy="160" r="7" fill="#f5b544" />
                  <circle cx="60" cy="240" r="7" fill="#b6f23a" />
                  <circle cx="140" cy="240" r="7" fill="#e0655f" />
                </svg>

                <div className="absolute left-3 top-3 rounded-[10px] border border-white/[0.07] bg-[#111318]/90 px-3 py-2">
                  <p className="liq-eyebrow">Score</p>
                  <p className="liq-num text-[22px] font-semibold text-[#b6f23a]">87</p>
                </div>
                <div className="absolute right-3 top-3 rounded-[10px] border border-white/[0.07] bg-[#111318]/90 px-3 py-2">
                  <p className="liq-eyebrow">Reps</p>
                  <p className="liq-num text-[22px] font-semibold liq-t1">12</p>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 rounded-[10px] border border-[#b6f23a]/20 bg-[#111318]/90 px-3 py-2.5">
                  <Sparkles size={14} className="text-[#b6f23a]" />
                  <span className="text-[13px] font-medium text-[#b6f23a]">Keep your chest up</span>
                </div>
              </div>
            </Card>
            <div className="mt-4 flex items-center justify-center gap-6 text-[12px] liq-t3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#b6f23a]" />
                Good
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f5b544]" />
                Moderate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#e0655f]" />
                Needs fix
              </span>
            </div>
          </motion.div>
        </section>

        <section className="mt-20 md:mt-28">
          <p className="liq-eyebrow">Inside the app</p>
          <h2 className="liq-tight mt-3 text-[28px] font-semibold liq-t1 md:text-[32px]">
            Everything you need to train
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="p-5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#b6f23a]/10">
                  <feature.icon size={16} className="text-[#b6f23a]" />
                </div>
                <h3 className="text-[14px] font-semibold liq-t1">{feature.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed liq-t2">{feature.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 md:mt-24">
          <Card elevated className="flex flex-col items-start justify-between gap-6 p-7 md:flex-row md:items-center md:p-10">
            <div>
              <h2 className="liq-tight text-[24px] font-semibold liq-t1 md:text-[28px]">
                Ready for your next session?
              </h2>
              <p className="mt-2 max-w-md text-[14px] liq-t2">
                Sign in and open Train. Your data is stored securely.
              </p>
            </div>
            <Link
              href="/login"
              className="liq-btn-accent inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-[14px] font-semibold"
            >
              Sign in
              <ArrowRight size={16} />
            </Link>
          </Card>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] py-6">
        <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-3 px-5">
          <LiftIQLogo compact />
          <span className="text-[12px] liq-t3">Train smarter. Get stronger.</span>
        </div>
      </footer>
    </div>
  );
}
