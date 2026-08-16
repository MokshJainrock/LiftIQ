"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { LiftIQLogo, LiftIQMark } from "@/components/liftiq/logo";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Sign in failed");
        return;
      }
      window.location.assign("/v2");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Sign up failed");
        return;
      }
      window.location.assign("/v2");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") void handleLogin();
    else void handleSignup();
  };

  const inp =
    "h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] text-[14px] liq-t1 placeholder:text-[#4b5058] transition-colors hover:border-white/[0.13] focus:border-[#b6f23a]/40 focus:outline-none";

  return (
    <div className="liq liq-auth-bg relative flex min-h-[100dvh] flex-col lg:flex-row">
      <div aria-hidden className="liq-grid-lines pointer-events-none absolute inset-0" />

      <div className="relative hidden flex-1 flex-col justify-between border-r border-white/[0.06] p-12 lg:flex xl:p-16">
        <Link href="/">
          <LiftIQLogo />
        </Link>
        <div className="max-w-[520px]">
          <h1 className="liq-tight text-[46px] font-semibold leading-[1.06] liq-t1 xl:text-[56px]">
            Train smarter.
            <br />
            Get stronger.
          </h1>
          <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed liq-t2">
            Intelligent strength training built around your performance.
          </p>
        </div>
        <p className="text-[12px] liq-t3">Your data is stored securely.</p>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-5 py-10 lg:max-w-[520px] lg:p-12"
        style={{ paddingTop: "max(2.5rem, var(--safe-top))", paddingBottom: "max(2.5rem, var(--safe-bottom))" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.3, 1] }}
          className="w-full max-w-[380px]"
        >
          <div className="lg:hidden">
            <Link href="/" aria-label="Lift IQ home">
              <LiftIQMark size={32} />
            </Link>
            <h1 className="liq-tight mt-5 text-[28px] font-semibold leading-tight liq-t1">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-[14px] liq-t2">
              {mode === "login"
                ? "Sign in to continue training."
                : "A few details and you can start a session."}
            </p>
            <div className="my-7 h-px bg-white/[0.07]" />
          </div>

          <div className="hidden lg:block">
            <h2 className="liq-tight text-[22px] font-semibold liq-t1">
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
            <p className="mt-1.5 text-[13.5px] liq-t2">
              {mode === "login"
                ? "Continue to your training dashboard."
                : "Set up your Lift IQ account."}
            </p>
          </div>

          <form className="mt-7 space-y-3.5" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div>
                <label htmlFor="fullName" className="liq-eyebrow mb-2 block">
                  Full name
                </label>
                <div className="relative">
                  <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    required
                    className={cn(inp, "pl-10 pr-3.5")}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="liq-eyebrow mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={cn(inp, "pl-10 pr-3.5")}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="liq-eyebrow mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                  required
                  minLength={6}
                  className={cn(inp, "pl-10 pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#6b7280] hover:text-[#f7f7f8]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-[#e0655f]/25 bg-[#e0655f]/10 px-4 py-3 text-[12.5px] text-[#e0655f]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="liq-btn-accent liq-glow flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] liq-t3">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="font-medium text-[#b6f23a] hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="font-medium text-[#b6f23a] hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
