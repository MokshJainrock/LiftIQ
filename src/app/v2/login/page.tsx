"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Apple, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { LiftIQLogo, LiftIQMark } from "@/components/liftiq/logo";
import { href } from "@/components/liftiq/nav-config";
import { Button } from "@/components/liftiq/primitives";

/** Abstract performance graphic — ascending bars under a rising trend line. */
function PerformanceGraphic() {
  const bars = [26, 38, 33, 52, 61, 55, 74, 86, 79, 100];
  const line = "M0,182 C40,170 78,158 120,140 C168,120 206,112 250,92 C296,70 336,54 380,28";

  return (
    <svg
      viewBox="0 0 380 200"
      className="h-auto w-full max-w-[520px]"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="auth-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b6f23a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#b6f23a" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="auth-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.13" />
        </linearGradient>
      </defs>

      {bars.map((h, i) => (
        <motion.rect
          key={i}
          x={i * 39}
          width="22"
          rx="4"
          fill="url(#auth-bar)"
          initial={{ height: 0, y: 196 }}
          animate={{ height: h * 1.7, y: 196 - h * 1.7 }}
          transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: [0.2, 0.8, 0.3, 1] }}
        />
      ))}

      <motion.path
        d={line}
        stroke="url(#auth-line)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }}
      />
      <motion.circle
        cx="380"
        cy="28"
        r="4.5"
        fill="#b6f23a"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 1.4 }}
      />
    </svg>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="liq-auth-bg relative flex min-h-[100dvh] flex-col lg:flex-row">
      <div aria-hidden className="liq-grid-lines pointer-events-none absolute inset-0" />

      {/* Brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between border-r border-white/[0.06] p-12 lg:flex xl:p-16">
        <LiftIQLogo />

        <div className="max-w-[520px]">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.3, 1] }}
            className="liq-tight text-[46px] font-semibold leading-[1.06] liq-t1 xl:text-[56px]"
          >
            Train smarter.
            <br />
            Get stronger.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08, ease: [0.2, 0.8, 0.3, 1] }}
            className="mt-5 max-w-[440px] text-[15px] leading-relaxed liq-t2"
          >
            Intelligent strength training built around your performance.
          </motion.p>

          <div className="mt-12">
            <PerformanceGraphic />
          </div>
        </div>

        <div className="flex gap-10">
          {[
            { value: "1.2M", label: "Sets logged" },
            { value: "94%", label: "Hit their next PR" },
            { value: "4.9", label: "App Store rating" },
          ].map((s) => (
            <div key={s.label}>
              <p className="liq-num text-[20px] font-semibold liq-t1">{s.value}</p>
              <p className="mt-0.5 text-[12px] liq-t3">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center p-6 py-14 lg:max-w-[520px] lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.3, 1] }}
          className="w-full max-w-[380px]"
        >
          <div className="lg:hidden">
            <LiftIQMark size={34} />
            <h1 className="liq-tight mt-6 text-[30px] font-semibold leading-tight liq-t1">
              Train smarter.
              <br />
              Get stronger.
            </h1>
            <p className="mt-3 text-[14px] liq-t2">
              Intelligent strength training built around your performance.
            </p>
            <div className="my-8 h-px bg-white/[0.07]" />
          </div>

          <div className="hidden lg:block">
            <h2 className="liq-tight text-[22px] font-semibold liq-t1">Sign in</h2>
            <p className="mt-1.5 text-[13.5px] liq-t2">Continue to your training dashboard.</p>
          </div>

          <div className="mt-7 space-y-2.5">
            <button className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-[#f7f7f8] text-[13.5px] font-semibold text-[#0c0d10] transition-transform duration-150 active:scale-[0.99]">
              <Apple size={17} />
              Continue with Apple
            </button>
            <button className="liq-btn-ghost flex h-11 w-full items-center justify-center gap-2.5 rounded-xl text-[13.5px] font-medium">
              <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.95-2.18l-2.91-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H1v2.34A8.99 8.99 0 0 0 9 18Z"
                />
                <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H1a9 9 0 0 0 0 8.12l2.97-2.34Z" />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A8.99 8.99 0 0 0 1 4.94l2.97 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-white/[0.07]" />
            <span className="text-[11.5px] liq-t3">or</span>
            <span className="h-px flex-1 bg-white/[0.07]" />
          </div>

          <form
            className="space-y-3.5"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = href();
            }}
          >
            <div>
              <label htmlFor="email" className="liq-eyebrow mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7280]"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="alex@liftiq.app"
                  className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] pl-10 pr-3.5 text-[13.5px] liq-t1 transition-colors duration-150 placeholder:text-[#4b5058] hover:border-white/[0.13] focus:border-[#b6f23a]/40 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="liq-eyebrow">
                  Password
                </label>
                <button type="button" className="text-[11.5px] liq-t3 transition-colors hover:text-[#b6f23a]">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7280]"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] pl-10 pr-10 text-[13.5px] liq-t1 transition-colors duration-150 placeholder:text-[#4b5058] hover:border-white/[0.13] focus:border-[#b6f23a]/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7280] transition-colors duration-150 hover:text-[#f7f7f8]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="accent" size="lg" className="w-full">
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-[12.5px] liq-t3">
            New to Lift IQ?{" "}
            <Link href={href()} className="font-medium text-[#b6f23a] hover:underline">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
