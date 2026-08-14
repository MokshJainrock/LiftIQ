import { cn } from "@/lib/utils";

/**
 * Abstract Lift IQ mark: a tall stem plus two ascending bars sharing one
 * baseline — reads as an "L" and as upward progression.
 */
export function LiftIQMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect x="3" y="3.5" width="4.4" height="17" rx="1.6" fill="#F7F7F8" />
      <rect x="9.8" y="12" width="4.4" height="8.5" rx="1.6" fill="#F7F7F8" fillOpacity="0.4" />
      <rect x="16.6" y="7.5" width="4.4" height="13" rx="1.6" fill="#B6F23A" />
    </svg>
  );
}

export function LiftIQLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LiftIQMark size={compact ? 24 : 28} />
      {!compact && (
        <span className="text-[15px] font-semibold uppercase tracking-[0.16em] liq-t1">
          Lift IQ
        </span>
      )}
    </span>
  );
}
