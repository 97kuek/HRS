const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 12;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function consumeChatRateLimit(key: string, now = Date.now()) {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS });
    return { ok: true as const };
  }

  if (existing.count >= CHAT_RATE_LIMIT_MAX_REQUESTS) {
    return {
      ok: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true as const };
}

export function resetChatRateLimitForTests() {
  buckets.clear();
}
