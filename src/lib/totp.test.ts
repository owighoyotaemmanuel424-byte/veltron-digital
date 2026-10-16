import { afterEach, describe, expect, it, vi } from "vitest";
import { decryptTotpSecret, encryptTotpSecret, verifyTotp } from "@/lib/totp";
afterEach(() => vi.unstubAllEnvs());
describe("TOTP support", () => {
  it("accepts an RFC 6238 SHA-1 test vector", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(verifyTotp(secret, "287082", 59000)).toBe(true);
    expect(verifyTotp(secret, "000000", 59000)).toBe(false);
  });
  it("encrypts and decrypts authenticator secrets", () => {
    vi.stubEnv("AUTH_SECRET", "ci-only-secret-that-is-at-least-thirty-two-characters-long");
    const encrypted = encryptTotpSecret("JBSWY3DPEHPK3PXP");
    expect(encrypted).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptTotpSecret(encrypted)).toBe("JBSWY3DPEHPK3PXP");
  });
});
