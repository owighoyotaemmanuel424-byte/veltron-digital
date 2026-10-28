import { describe, expect, it } from "vitest";

import { MemoryRateLimiter, refill, take } from "../lib/rate-limit.js";
import { signWebhookBody, verifySecretToken, verifyWebhookSignature } from "../lib/telegram.js";
import { generateTotp, verifyTotp } from "../lib/totp.js";

describe("token bucket", () => {
  const config = { capacity: 3, refillPerSecond: 1 };

  it("allows the burst then denies", () => {
    let state = take(null, config, 1, 0);
    expect(state.result.allowed).toBe(true);
    state = take(state.snapshot, config, 1, 0);
    state = take(state.snapshot, config, 1, 0);
    expect(state.result.remaining).toBe(0);
    const denied = take(state.snapshot, config, 1, 0);
    expect(denied.result.allowed).toBe(false);
    expect(denied.result.retryAfterMs).toBe(1000);
  });

  it("refills over time and caps at capacity", () => {
    const snapshot = refill({ tokens: 0, updatedAt: 0 }, config, 10_000);
    expect(snapshot.tokens).toBe(3);
  });

  it("isolates clients by key", async () => {
    const limiter = new MemoryRateLimiter({ capacity: 1, refillPerSecond: 0.001 });
    expect((await limiter.consume("a")).allowed).toBe(true);
    expect((await limiter.consume("a")).allowed).toBe(false);
    expect((await limiter.consume("b")).allowed).toBe(true);
  });
});

describe("telegram webhook authentication", () => {
  const secret = "super-secret-webhook-value";
  const body = JSON.stringify({ update_id: 1 });

  it("accepts a correct HMAC signature", () => {
    const signature = signWebhookBody(secret, body);
    expect(verifyWebhookSignature(secret, body, signature)).toBe(true);
  });

  it("rejects a tampered body or a missing signature", () => {
    const signature = signWebhookBody(secret, body);
    expect(verifyWebhookSignature(secret, `${body} `, signature)).toBe(false);
    expect(verifyWebhookSignature(secret, body, undefined)).toBe(false);
    expect(verifyWebhookSignature(secret, body, "deadbeef")).toBe(false);
  });

  it("compares the bot secret token in constant time", () => {
    expect(verifySecretToken(secret, secret)).toBe(true);
    expect(verifySecretToken(secret, "nope")).toBe(false);
    expect(verifySecretToken(secret, undefined)).toBe(false);
  });
});

describe("TOTP", () => {
  const secret = "JBSWY3DPEHPK3PXP";

  it("verifies a freshly generated code", () => {
    const now = Date.now();
    const code = generateTotp(secret, Math.floor(now / 1000 / 30));
    expect(verifyTotp(secret, code, now)).toBe(true);
  });

  it("accepts one step of drift and rejects two", () => {
    const now = Date.now();
    const step = Math.floor(now / 1000 / 30);
    expect(verifyTotp(secret, generateTotp(secret, step - 1), now)).toBe(true);
    expect(verifyTotp(secret, generateTotp(secret, step - 3), now)).toBe(false);
  });

  it("rejects malformed codes", () => {
    expect(verifyTotp(secret, "12345")).toBe(false);
    expect(verifyTotp(secret, "abcdef")).toBe(false);
  });
});
