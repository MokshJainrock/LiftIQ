"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MOBILE_NAV, href } from "./nav-config";

export function MobileNavigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    const target = href(path);
    return path === "" ? pathname === target || pathname === `${target}/` : pathname.startsWith(target);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-[#0b0c0f]/92 backdrop-blur-xl min-[960px]:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="flex items-stretch">
        {MOBILE_NAV.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <li key={item.label} className="flex-1">
              <Link
                href={href(item.path)}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center gap-1 py-2.5"
              >
                {active && (
                  <motion.span
                    layoutId="liq-mobile-active"
                    transition={{ duration: 0.2, ease: [0.2, 0.8, 0.3, 1] }}
                    className="absolute top-0 h-[2px] w-8 rounded-full bg-[#b6f23a]"
                  />
                )}
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors duration-150",
                    active ? "text-[#b6f23a]" : "text-[#6b7280]"
                  )}
                />
                <span
                  className={cn(
                    "text-[10.5px] font-medium transition-colors duration-150",
                    active ? "text-[#f7f7f8]" : "text-[#6b7280]"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
