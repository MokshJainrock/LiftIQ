"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { LiftIQLogo } from "./logo";
import { FOOTER_NAV, PRIMARY_NAV, SECONDARY_NAV, href } from "./nav-config";
import { USER } from "@/lib/liftiq/demo-data";

type NavItem = { label: string; path: string; icon: React.ComponentType<{ size?: number; className?: string }> };

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={href(item.path)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-colors duration-150",
        active
          ? "bg-white/[0.06] text-[#f7f7f8]"
          : "text-[#9ca3af] hover:bg-white/[0.035] hover:text-[#f7f7f8]"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r-full bg-[#b6f23a]" />
      )}
      <Icon size={17} className={active ? "text-[#b6f23a]" : "text-current"} />
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => {
    const target = href(path);
    return path === "" ? pathname === target || pathname === `${target}/` : pathname.startsWith(target);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-white/[0.07] bg-[#0b0c0f] min-[960px]:flex">
      <div className="flex h-16 items-center px-5">
        <Link href={href()} className="flex items-center">
          <LiftIQLogo />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={isActive(item.path)} />
          ))}
        </div>

        <div className="my-4 h-px bg-white/[0.06]" />

        <p className="liq-eyebrow px-3 pb-2">Insights</p>
        <div className="space-y-0.5">
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={isActive(item.path)} />
          ))}
        </div>
      </nav>

      <div className="border-t border-white/[0.07] p-3">
        <div className="space-y-0.5">
          {FOOTER_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={isActive(item.path)} />
          ))}
        </div>

        <Link
          href={href("/settings")}
          className="mt-2 flex items-center gap-3 rounded-[10px] px-2 py-2 transition-colors duration-150 hover:bg-white/[0.04]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/[0.14] to-white/[0.05] text-[12px] font-semibold liq-t1">
            {USER.initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium liq-t1">{USER.name}</span>
            <span className="block truncate text-[11.5px] liq-t3">{USER.level}</span>
          </span>
          <ChevronRight size={15} className="text-[#6b7280]" />
        </Link>
      </div>
    </aside>
  );
}
