"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  Dumbbell,
  LogOut,
  Salad,
  Settings,
  Video,
  Menu,
  X,
} from "lucide-react";
import { clearAllStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Activity },
  { href: "/workout", label: "AI Exercise", icon: Dumbbell },
  { href: "/diet", label: "Diet", icon: Salad },
  { href: "/exercises", label: "Exercises", icon: BookOpen },
  { href: "/mind", label: "Mind", icon: Brain },
  { href: "/recordings", label: "Library", icon: Video },
  { href: "/dashboard", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Mobile: 4 primary tabs flank an elevated center action; everything else
// lives behind the "More" sheet so the bar stays clean and thumb-friendly.
const centerItem = { href: "/workout", label: "AI Exercise", icon: Dumbbell };
const primaryMobile = [
  { href: "/", label: "Home", icon: Activity },
  { href: "/diet", label: "Diet", icon: Salad },
  { href: "/dashboard", label: "Stats", icon: BarChart3 },
];
const moreItems = [
  { href: "/exercises", label: "Exercises", icon: BookOpen },
  { href: "/mind", label: "Mind", icon: Brain },
  { href: "/recordings", label: "Library", icon: Video },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the sheet whenever we navigate.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // New `/v2` shell has its own sidebar + mobile nav — never stack the old chrome.
  if (pathname === "/v2" || pathname.startsWith("/v2/")) return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // ignore — still clear local state and redirect
    }
    clearAllStorage();
    router.push("/login");
    router.refresh();
  };

  const moreActive = moreItems.some((i) => isActive(pathname, i.href));

  return (
    <>
      {/* Reserve space so content is not covered by the fixed desktop header */}
      <div className="hidden md:block h-16 shrink-0" aria-hidden="true" />

      {/* ─── Desktop: fixed top bar ─── */}
      <header className="fixed top-0 left-0 right-0 z-[100] hidden h-16 border-b border-border bg-background md:block">
        <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <Image src="/logo.png" alt="LiftIQ" width={56} height={56} className="rounded-xl" />
            <span className="text-lg font-extrabold tracking-tight">
              Lift
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">IQ</span>
            </span>
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-0.5">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200",
                    active ? "text-cyan-300" : "text-zinc-500 hover:text-zinc-200"
                  )}
                >
                  <item.icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.5} />
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                  )}
                </Link>
              );
            })}
            <div className="mx-2 hidden h-5 w-px bg-white/[0.06] sm:block" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-zinc-600 transition-colors hover:text-zinc-300"
              title="Logout"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </nav>
      </header>

      {/* ─── Mobile: "More" sheet ─── */}
      {moreOpen && (
        <div className="fixed inset-0 z-[110] md:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
          />
          <div
            className="absolute bottom-0 left-0 right-0 glass-elevated rounded-t-3xl p-5 pb-[calc(1.25rem+var(--safe-bottom))] animate-[slideUp_0.22s_cubic-bezier(0.16,1,0.3,1)]"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-200">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border p-3 transition-colors",
                      active
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-400 active:bg-white/[0.05]"
                    )}
                  >
                    <item.icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.6} />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] py-3 text-sm font-semibold text-rose-300 active:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      )}

      {/* ─── Mobile: bottom tab bar with elevated center action ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] md:hidden border-t border-white/[0.07] bg-[#0a0a0f]/90 backdrop-blur-2xl"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        {/* subtle top highlight for depth */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative mx-auto flex h-[60px] max-w-md items-stretch justify-between px-2">
          {/* left two */}
          {primaryMobile.slice(0, 2).map((item) => (
            <TabButton key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}

          {/* center elevated action */}
          <div className="flex w-[68px] shrink-0 flex-col items-center">
            <Link
              href={centerItem.href}
              aria-label={centerItem.label}
              className={cn(
                "group relative -mt-7 flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 active:scale-90",
                "bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600",
                "shadow-[0_8px_24px_-4px_rgba(6,182,212,0.55)] ring-1 ring-inset ring-white/25",
              )}
            >
              {/* soft outer ring that separates the FAB from the bar */}
              <span className="absolute -inset-[5px] -z-10 rounded-full bg-[#0a0a0f]" />
              {isActive(pathname, centerItem.href) && (
                <span className="absolute -inset-[5px] -z-10 rounded-full ring-2 ring-cyan-400/60" />
              )}
              <centerItem.icon className="h-6 w-6 text-white drop-shadow-sm" strokeWidth={2.4} />
            </Link>
            <span
              className={cn(
                "mt-0.5 text-[10px] font-semibold tracking-wide transition-colors",
                isActive(pathname, centerItem.href) ? "text-cyan-300" : "text-zinc-400",
              )}
            >
              AI
            </span>
          </div>

          {/* right one + More */}
          {primaryMobile.slice(2).map((item) => (
            <TabButton key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More"
            className={cn(
              "relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
              moreActive || moreOpen ? "text-cyan-400" : "text-zinc-500 active:text-zinc-300",
            )}
          >
            {(moreActive || moreOpen) && (
              <span className="absolute top-0 h-[3px] w-7 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
            )}
            <Menu className="h-[22px] w-[22px] shrink-0" strokeWidth={moreActive || moreOpen ? 2.4 : 1.75} />
            <span className="truncate text-[10px] font-medium tracking-wide">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function TabButton({
  item,
  active,
}: {
  item: { href: string; label: string; icon: typeof Activity };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
        active ? "text-cyan-400" : "text-zinc-500 active:text-zinc-300",
      )}
    >
      {active && (
        <span className="absolute top-0 h-[3px] w-7 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
      )}
      <item.icon className="h-[22px] w-[22px] shrink-0" strokeWidth={active ? 2.4 : 1.75} />
      <span className="truncate text-[10px] font-medium tracking-wide">{item.label}</span>
    </Link>
  );
}
