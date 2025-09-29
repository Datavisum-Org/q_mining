const windows = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

interface ConsumeOptions {
  key: string;
  identifier?: string;
  limit: number;
  windowMs: number;
}

function buildWindowKey(key: string, identifier: string): string {
  return `${key}:${identifier}`;
}

export function consumeRateLimit({
  key,
  identifier = "global",
  limit,
  windowMs,
}: ConsumeOptions): RateLimitResult {
  const now = Date.now();
  const mapKey = buildWindowKey(key, identifier);
  const existing = windows.get(mapKey);

  const resetAt = existing && existing.resetAt > now ? existing.resetAt : now + windowMs;
  const count = existing && existing.resetAt > now ? existing.count : 0;
  const nextCount = count + 1;

  const allowed = nextCount <= limit;
  const remaining = allowed ? limit - nextCount : 0;
  const retryAfterSeconds = allowed ? 0 : Math.max(0, Math.ceil((resetAt - now) / 1000));

  windows.set(mapKey, {
    count: allowed ? nextCount : count,
    resetAt,
  });

  return {
    allowed,
    limit,
    remaining,
    resetAt: new Date(resetAt),
    retryAfterSeconds,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
  };
}

export function toRateLimitMeta(result: RateLimitResult) {
  return {
    limit: result.limit,
    remaining: result.remaining,
    resetAt: result.resetAt.toISOString(),
  } as const;
}
