"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Eye,
  Salad,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  Zap,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

const features = [
  {
    icon: Eye,
    title: "Real-time pose tracking",
    description: "Camera-based joint detection with a color-coded skeleton so you can see form quality as you move.",
  },
  {
    icon: Target,
    title: "Form scoring",
    description: "Every rep is scored out of 100 on depth, alignment, posture, and consistency.",
  },
  {
    icon: Sparkles,
    title: "Live coaching cues",
    description: "Instant corrections like “go lower”, “keep your back straight”, and “don’t let your knees cave in”.",
  },
  {
    icon: Salad,
    title: "Diet tracking",
    description: "Log meals and stay on a calorie target built from your profile.",
  },
  {
    icon: Brain,
    title: "Mind tools",
    description: "Check-ins, breathing, and journaling so recovery sits next to training.",
  },
  {
    icon: BarChart3,
    title: "Progress analytics",
    description: "History, score trends, volume, and streaks in one place.",
  },
  {
    icon: Volume2,
    title: "Voice coach",
    description: "Hands-free cues through the browser so you can keep your eyes on the lift.",
  },
  {
    icon: Zap,
    title: "AI-tracked exercises",
    description: "Built-in camera exercises plus your own library, weights, reps, and sets.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const ctaClass =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-7 text-base font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 transition-all hover:shadow-[0_0_32px_-4px_rgba(6,182,212,0.4)] hover:brightness-110";

function Wordmark({ className = "text-lg" }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight ${className}`}>
      Lift
      <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">IQ</span>
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="noise relative min-h-[100dvh] overflow-hidden bg-[#030305]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-18%] left-[18%] h-[50vh] w-[50vh] rounded-full bg-cyan-500/[0.07] blur-[100px]" />
        <div className="absolute bottom-[-8%] right-[8%] h-[42vh] w-[42vh] rounded-full bg-blue-500/[0.05] blur-[80px]" />
      </div>

      <header
        className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 md:px-8"
        style={{ paddingTop: "max(1.25rem, var(--safe-top))" }}
      >
        <Link href="/" className="flex items-center py-3">
          <Wordmark />
        </Link>
        <Link
          href="/login"
          className="py-3 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          Sign in
        </Link>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-5 pb-14 pt-8 md:px-8 md:pb-20 md:pt-12">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} className="mb-5 flex justify-center">
              <Image src="/logo.png" alt="LiftIQ" width={112} height={112} className="rounded-2xl" priority />
            </motion.div>
            <motion.p
              variants={fadeUp}
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400"
            >
              AI form coach
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
            >
              Your camera is
              <br />
              your coach.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-400 sm:text-base"
            >
              LiftIQ tracks your joints in real time, scores every rep, and coaches form,
              diet, and recovery — from a browser, with just a camera.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link href="/login" className={`${ctaClass} w-full sm:w-auto`}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/v2"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] px-7 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-white sm:w-auto"
              >
                Open the app
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="mx-auto mt-12 max-w-3xl md:mt-16"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <GlassCard elevated glow className="rounded-2xl p-1.5">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#05060a] md:aspect-[16/10]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.16),transparent_62%)]" />

                <svg
                  viewBox="0 0 200 300"
                  className="relative h-[68%] w-auto drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]"
                  aria-hidden
                >
                  <circle cx="100" cy="40" r="20" fill="none" stroke="#22d3ee" strokeWidth="4" />
                  <line x1="100" y1="60" x2="100" y2="160" stroke="#22d3ee" strokeWidth="4" />
                  <line x1="100" y1="90" x2="50" y2="130" stroke="#22d3ee" strokeWidth="4" />
                  <line x1="100" y1="90" x2="150" y2="130" stroke="#22d3ee" strokeWidth="4" />
                  <line x1="100" y1="160" x2="60" y2="240" stroke="#22d3ee" strokeWidth="4" />
                  <line x1="100" y1="160" x2="140" y2="240" stroke="#f87171" strokeWidth="4" />
                  <circle cx="100" cy="90" r="7" fill="#22d3ee" />
                  <circle cx="50" cy="130" r="7" fill="#22d3ee" />
                  <circle cx="150" cy="130" r="7" fill="#22d3ee" />
                  <circle cx="100" cy="160" r="7" fill="#facc15" />
                  <circle cx="60" cy="240" r="7" fill="#22d3ee" />
                  <circle cx="140" cy="240" r="7" fill="#f87171" />
                </svg>

                <div className="absolute left-3 top-3 rounded-xl border border-white/[0.08] bg-[#0a0b10]/90 px-3 py-2 backdrop-blur-sm md:left-4 md:top-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Score</p>
                  <p className="text-xl font-black text-cyan-400 md:text-2xl">87</p>
                </div>
                <div className="absolute right-3 top-3 rounded-xl border border-white/[0.08] bg-[#0a0b10]/90 px-3 py-2 backdrop-blur-sm md:right-4 md:top-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Reps</p>
                  <p className="text-xl font-black text-cyan-400 md:text-2xl">12</p>
                </div>
                <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-cyan-500/20 bg-[#0a0b10]/90 px-3 py-2.5 text-center backdrop-blur-sm md:bottom-4 md:left-4 md:right-4">
                  <span className="text-xs font-semibold text-cyan-300 md:text-sm">Keep your chest up</span>
                </div>
              </div>
            </GlassCard>
            <div className="mt-5 flex items-center justify-center gap-6 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                Good
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                Moderate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                Needs fix
              </span>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8 md:pb-24">
          <div className="mb-8 text-center md:mb-12">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Train smarter with <Wordmark className="text-2xl sm:text-3xl" />
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
              Form, nutrition, and recovery in the same dark, focused workspace.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard className="h-full rounded-2xl p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10">
                    <feature.icon className="h-4 w-4 text-cyan-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100">{feature.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{feature.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-xl px-5 pb-20 text-center md:px-8">
          <GlassCard elevated glow className="rounded-2xl p-8 md:p-10">
            <Trophy className="mx-auto mb-4 h-8 w-8 text-cyan-400" />
            <h2 className="text-2xl font-black tracking-tight text-white">Ready to level up your form?</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Sign in and start a session. Your data is stored securely.
            </p>
            <Link href="/login" className={`${ctaClass} mt-6 w-full`}>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </GlassCard>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-5">
          <Wordmark className="text-sm" />
          <span className="text-[11px] text-zinc-500">AI Form Coach</span>
        </div>
      </footer>
    </div>
  );
}
