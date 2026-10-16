import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { verifyPaystackSignature } from "@/lib/paystack";
afterEach(() => vi.unstubAllEnvs());
describe("Paystack signature verification", () => {
  it("rejects a missing secret or signature", () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", "");
    expect(verifyPaystackSignature("{}", null)).toBe(false);
  });
  it("accepts a matching HMAC SHA-512 signature", () => {
    const body = '{"event":"charge.success"}';
    const key = "test-secret-not-for-production";
    vi.stubEnv("PAYSTACK_SECRET_KEY", key);
    const signature = createHmac("sha512", key).update(body).digest("hex");
    expect(verifyPaystackSignature(body, signature)).toBe(true);
  });
  it("rejects a changed body", () => {
    const key = "test-secret-not-for-production";
    vi.stubEnv("PAYSTACK_SECRET_KEY", key);
    const signature = createHmac("sha512", key).update("{}").digest("hex");
    expect(verifyPaystackSignature('{"changed":true}', signature)).toBe(false);
  });
});
