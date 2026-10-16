import { describe, expect, it } from "vitest";
import { getClientAddress } from "./auth-rate-limit";

describe("getClientAddress", () => {
  it("prefers the platform-provided real IP", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.10", "x-forwarded-for": "198.51.100.8, 203.0.113.11" });
    expect(getClientAddress(headers)).toBe("203.0.113.10");
  });

  it("uses the final forwarded address when the real-IP header is absent", () => {
    const headers = new Headers({ "x-forwarded-for": "198.51.100.8, 203.0.113.11" });
    expect(getClientAddress(headers)).toBe("203.0.113.11");
  });

  it("returns a stable fallback when no client address is available", () => {
    expect(getClientAddress(new Headers())).toBe("unknown");
  });
});
