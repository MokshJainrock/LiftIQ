"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/* ── Surfaces ────────────────────────────────────────────────── */

export function Card({
  children,
  className,
  elevated,
  hover,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  hover?: boolean;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag className={cn(elevated ? "liq-elev" : "liq-card", hover && "liq-hover", className)}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  eyebrow,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="liq-eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="liq-tight text-[15px] font-semibold liq-t1">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] liq-t2">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ── Labels ──────────────────────────────────────────────────── */

const PILL_TONES = {
  accent: "bg-[#b6f23a]/12 text-[#b6f23a] border-[#b6f23a]/25",
  good: "bg-[#4ade80]/10 text-[#7dd88f] border-[#4ade80]/20",
  warn: "bg-[#f5b544]/10 text-[#f5b544] border-[#f5b544]/22",
  danger: "bg-[#e0655f]/10 text-[#e0655f] border-[#e0655f]/22",
  neutral: "bg-white/[0.05] liq-t2 border-white/8",
} as const;

export type PillTone = keyof typeof PILL_TONES;

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        PILL_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Delta({
  value,
  unit = "%",
  suffix,
  className,
}: {
  value: number;
  unit?: string;
  suffix?: string;
  className?: string;
}) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "liq-num text-[12px] font-medium",
        positive ? "text-[#b6f23a]" : "text-[#e0655f]",
        className
      )}
    >
      {positive ? "+" : ""}
      {value}
      {unit}
      {suffix ? <span className="liq-t3 font-normal"> {suffix}</span> : null}
    </span>
  );
}

/* ── Buttons ─────────────────────────────────────────────────── */

export function Button({
  children,
  variant = "ghost",
  size = "md",
  className,
  onClick,
  disabled,
  type = "button",
  title,
}: {
  children: ReactNode;
  variant?: "accent" | "ghost" | "quiet";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
}) {
  const sizes = {
    sm: "h-8 px-3 text-[12px] rounded-lg gap-1.5",
    md: "h-10 px-4 text-[13px] rounded-[10px] gap-2",
    lg: "h-12 px-6 text-[14px] rounded-xl gap-2",
  };
  const variants = {
    accent: "liq-btn-accent font-semibold",
    ghost: "liq-btn-ghost font-medium",
    quiet:
      "text-[#9ca3af] hover:text-[#f7f7f8] hover:bg-white/[0.05] font-medium transition-colors",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-45",
        sizes[size],
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex items-center gap-0.5 rounded-[10px] bg-white/[0.04] p-0.5", className)}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt)}
            className={cn(
              "relative rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
              active ? "text-[#f7f7f8]" : "text-[#6b7280] hover:text-[#9ca3af]"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.join("-")}`}
                transition={{ duration: 0.18, ease: [0.2, 0.8, 0.3, 1] }}
                className="absolute inset-0 rounded-lg bg-white/[0.08]"
              />
            )}
            <span className="relative">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Data display ────────────────────────────────────────────── */

/** Circular gauge. Renders identically on server and client. */
export function Ring({
  value,
  max = 100,
  size = 96,
  stroke = 7,
  color = "#b6f23a",
  track = "rgba(255,255,255,0.08)",
  children,
  className,
  animate = true,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  className?: string;
  animate?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={animate ? { strokeDashoffset: c } : false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** Compact trend line for metric cards. */
export function Sparkline({
  data,
  width = 96,
  height = 32,
  color = "#b6f23a",
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((d - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width - pad},${height} L${pad},${height} Z`;
  const gid = `spark-${color.replace("#", "")}-${data.length}`;

  return (
    <svg width={width} height={height} className={cn("overflow-visible", className)} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.4" fill={color} />
    </svg>
  );
}

/** Horizontal progress bar. */
export function Bar({
  value,
  max = 100,
  color = "#b6f23a",
  className,
  height = 6,
  delay = 0,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  height?: number;
  delay?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-white/[0.06]", className)}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.3, 1] }}
      />
    </div>
  );
}

/* ── Layout helpers ──────────────────────────────────────────── */

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        <h1 className="liq-tight text-[26px] font-semibold liq-t1 md:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14px] liq-t2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Scroll-triggered entrance. Fast, no bounce; skipped when the user prefers reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -48px 0px" }}
      transition={{ duration: 0.45, delay, ease: [0.2, 0.8, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] liq-t3">
        {icon}
      </div>
      <p className="text-[14px] font-medium liq-t1">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] liq-t3">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("liq-skeleton", className)} />;
}

/** Lightweight CSS tooltip — no extra dependency, keyboard accessible. */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg border border-white/10 bg-[#191c22] px-2.5 py-1.5 text-[11px] liq-t1 opacity-0 shadow-xl transition-all duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-focus-within/tip:translate-y-0 group-focus-within/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
