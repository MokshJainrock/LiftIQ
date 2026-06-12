// Best-effort in-memory rate limiter for the public /api routes that spend
// LLM/USDA quota. Per server instance (resets on deploy/cold start) — enough
// to stop casual abuse without external infra.

const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;

/**
 * Sliding-window check. Returns true if the request is allowed.
 * `key` should combine the route name and the caller identity (IP).
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (buckets.size > MAX_BUCKETS) buckets.clear();

  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** Caller identity from proxy headers (Vercel sets x-forwarded-for). */
export function clientKey(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
