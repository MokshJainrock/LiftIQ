import { LIQ_BASE } from "@/components/liftiq/nav-config";

/** Longest-prefix first so `/workout/live` wins over `/workout`. */
const V2_REWRITES: [string, string][] = [
  ["/workout/live", `${LIQ_BASE}/train/live`],
  ["/workout", `${LIQ_BASE}/train`],
  ["/recordings", `${LIQ_BASE}/library`],
  ["/dashboard", `${LIQ_BASE}/stats`],
  ["/history", `${LIQ_BASE}/history`],
  ["/diet", `${LIQ_BASE}/diet`],
  ["/mind", `${LIQ_BASE}/mind`],
  ["/settings", `${LIQ_BASE}/settings`],
  ["/exercises", `${LIQ_BASE}/exercises`],
  ["/onboarding", "/onboarding"],
];

export function isV2Path(pathname: string): boolean {
  return pathname === LIQ_BASE || pathname.startsWith(`${LIQ_BASE}/`);
}

/** Remap an old-app path when the user is already inside the new `/v2` shell. */
export function featurePath(pathname: string, path: string): string {
  if (!isV2Path(pathname)) return path;
  const qIndex = path.indexOf("?");
  const base = qIndex === -1 ? path : path.slice(0, qIndex);
  const query = qIndex === -1 ? "" : path.slice(qIndex);
  for (const [from, to] of V2_REWRITES) {
    if (base === from || base.startsWith(`${from}/`)) {
      return `${to}${base.slice(from.length)}${query}`;
    }
  }
  return path;
}
