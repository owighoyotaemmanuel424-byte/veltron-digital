import type Redis from "ioredis";

/**
 * Token-bucket rate limiting with a Redis backend for multi-instance
 * correctness and an in-memory backend for local development and tests.
 */

export type BucketConfig = { capacity: number; refillPerSecond: number };
export type BucketSnapshot = { tokens: number; updatedAt: number };
export type LimitResult = { allowed: boolean; remaining: number; retryAfterMs: number };

/** Pure bucket refill, exported so it can be unit tested without a clock. */
export function refill(snapshot: BucketSnapshot, config: BucketConfig, now: number): BucketSnapshot {
  const elapsedSeconds = Math.max(0, now - snapshot.updatedAt) / 1000;
  const tokens = Math.min(config.capacity, snapshot.tokens + elapsedSeconds * config.refillPerSecond);
  return { tokens, updatedAt: now };
}

export function take(
  snapshot: BucketSnapshot | null,
  config: BucketConfig,
  cost: number,
  now: number,
): { snapshot: BucketSnapshot; result: LimitResult } {
  const current = snapshot ? refill(snapshot, config, now) : { tokens: config.capacity, updatedAt: now };
  if (cost <= 0) {
    return { snapshot: current, result: { allowed: true, remaining: Math.floor(current.tokens), retryAfterMs: 0 } };
  }
  if (current.tokens >= cost) {
    const tokens = current.tokens - cost;
    return { snapshot: { tokens, updatedAt: now }, result: { allowed: true, remaining: Math.floor(tokens), retryAfterMs: 0 } };
  }
  const deficit = cost - current.tokens;
  const retryAfterMs = Math.ceil((deficit / config.refillPerSecond) * 1000);
  return { snapshot: current, result: { allowed: false, remaining: 0, retryAfterMs } };
}

export interface RateLimiter {
  consume(key: string, cost?: number): Promise<LimitResult>;
}

export function defaultLimits(): { auth: BucketConfig; api: BucketConfig } {
  return {
    // Login/2FA endpoints: 10 attempts burst, one refill every 6 seconds.
    auth: { capacity: 10, refillPerSecond: 1 / 6 },
    // General API: 120 burst, 60 req/s sustained per token/IP.
    api: { capacity: 120, refillPerSecond: 60 },
  };
}

const LUA_TOKEN_BUCKET = `
local capacity = tonumber(ARGV[1])
local refill = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local data = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])
if tokens == nil then
  tokens = capacity
  ts = now
end
local elapsed = math.max(0, now - ts) / 1000
tokens = math.min(capacity, tokens + elapsed * refill)
local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil((capacity / refill) * 1000) + 5000)
local retry = 0
if allowed == 0 then
  retry = math.ceil(((cost - tokens) / refill) * 1000)
end
return { allowed, math.floor(tokens), retry }
`;

export class RedisRateLimiter implements RateLimiter {
  constructor(
    private readonly redis: Redis,
    private readonly config: BucketConfig,
    private readonly namespace = "rl",
  ) {}

  async consume(key: string, cost = 1): Promise<LimitResult> {
    const now = Date.now();
    const reply = (await this.redis.eval(
      LUA_TOKEN_BUCKET,
      1,
      `${this.namespace}:${key}`,
      this.config.capacity,
      this.config.refillPerSecond,
      now,
      cost,
    )) as [number, number, number];
    const [allowed, remaining, retryAfterMs] = reply;
    return { allowed: allowed === 1, remaining, retryAfterMs };
  }
}

export class MemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, BucketSnapshot>();

  constructor(
    private readonly config: BucketConfig,
    private readonly now: () => number = Date.now,
  ) {}

  async consume(key: string, cost = 1): Promise<LimitResult> {
    const { snapshot, result } = take(this.buckets.get(key) ?? null, this.config, cost, this.now());
    this.buckets.set(key, snapshot);
    return result;
  }
}
