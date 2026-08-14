"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Flame, Menu, Search, X } from "lucide-react";
import { LiftIQLogo } from "./logo";
import { MORE_NAV, href } from "./nav-config";
import { USER } from "@/lib/liftiq/demo-data";
import { cn } from "@/lib/utils";

export function TopBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b bg-[#090a0c]/85 backdrop-blur-xl transition-[border-color,box-shadow] duration-300",
        scrolled
          ? "border-white/[0.12] shadow-[0_12px_32px_-18px_rgba(0,0,0,0.85)]"
          : "border-white/[0.07] shadow-none",
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-5 md:h-16 md:px-8">
        <Link href={href()} className="min-[960px]:hidden">
          <LiftIQLogo compact />
        </Link>

        <button className="hidden items-center gap-2 rounded-[10px] border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[13px] liq-t3 transition-colors duration-150 hover:border-white/[0.13] hover:bg-white/[0.05] min-[960px]:flex">
          <Search size={15} />
          <span>Search workouts, exercises…</span>
          <kbd className="ml-6 rounded border border-white/[0.09] bg-white/[0.04] px-1.5 py-0.5 text-[10px] liq-t3">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-[#f5b544]/20 bg-[#f5b544]/[0.08] px-2.5 py-1">
            <Flame size={13} className="text-[#f5b544]" />
            <span className="liq-num text-[12px] font-semibold liq-t1">{USER.streak}</span>
            <span className="hidden text-[11px] liq-t3 sm:inline">day streak</span>
          </div>

          <button
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-[#9ca3af] transition-colors duration-150 hover:bg-white/[0.05] hover:text-[#f7f7f8]"
          >
            <Bell size={17} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#b6f23a]" />
          </button>

          <button
            type="button"
            aria-label={moreOpen ? "Close menu" : "Open menu"}
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[#9ca3af] transition-colors duration-150 hover:bg-white/[0.05] hover:text-[#f7f7f8] min-[960px]:hidden"
          >
            {moreOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link
            href={href("/settings")}
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-white/[0.16] to-white/[0.05] text-[12px] font-semibold liq-t1 transition-transform duration-150 hover:scale-105"
          >
            {USER.initials}
          </Link>
        </div>
      </div>

      {moreOpen && (
        <div className="border-t border-white/[0.07] bg-[#0b0c0f] px-5 py-4 min-[960px]:hidden">
          <p className="liq-eyebrow pb-3">All features</p>
          <div className="grid grid-cols-2 gap-2">
            {MORE_NAV.map((item) => {
              const Icon = item.icon;
              const target = href(item.path);
              const active = pathname === target || pathname.startsWith(`${target}/`);
              return (
                <Link
                  key={item.path}
                  href={target}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-[13px] font-medium transition-colors",
                    active
                      ? "border-[#b6f23a]/30 bg-[#b6f23a]/[0.08] text-[#f7f7f8]"
                      : "border-white/[0.07] text-[#9ca3af] hover:bg-white/[0.04] hover:text-[#f7f7f8]",
                  )}
                >
                  <Icon size={16} className={active ? "text-[#b6f23a]" : "text-current"} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
