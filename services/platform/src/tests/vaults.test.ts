import { describe, expect, it } from "vitest";

import { formatAmount, parseAmount } from "../lib/money.js";
import { accrueInterest, hourBucket } from "../services/vaults.js";

describe("vault accrual", () => {
  it("returns one year of interest for a full year of hours", () => {
    const interest = accrueInterest(parseAmount("1000"), "5.00", 365 * 24);
    expect(formatAmount(interest)).toBe("50.00000000");
  });

  it("returns a pro-rata amount for a single hour", () => {
    const fullYear = accrueInterest(parseAmount("10000"), "7.20", 365 * 24);
    const oneHour = accrueInterest(parseAmount("10000"), "7.20", 1);
    expect(Number(formatAmount(fullYear))).toBeCloseTo(720, 5);
    expect(Number(formatAmount(oneHour))).toBeCloseTo(720 / 8760, 6);
  });

  it("never credits a zero or negative balance", () => {
    expect(accrueInterest(0n, "5.00", 24)).toBe(0n);
    expect(accrueInterest(-100n, "5.00", 24)).toBe(0n);
    expect(accrueInterest(parseAmount("100"), "0.00", 24)).toBe(0n);
  });

  it("rounds half-up so tiny hourly amounts still accrue", () => {
    const interest = accrueInterest(parseAmount("1"), "5.00", 1);
    expect(interest >= 0n).toBe(true);
    expect(Number(formatAmount(interest))).toBeLessThan(0.001);
  });

  it("uses a stable hourly bucket so retries cannot double-credit", () => {
    const date = new Date("2026-10-28T13:45:12.000Z");
    expect(hourBucket(date)).toBe("2026-10-28T13");
    expect(hourBucket(new Date("2026-10-28T13:59:59.000Z"))).toBe(hourBucket(date));
  });
});
