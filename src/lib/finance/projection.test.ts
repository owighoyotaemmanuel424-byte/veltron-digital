import { describe, expect, it } from "vitest";

import { projectMonths, projectVault } from "@/lib/finance/projection";

describe("projectVault", () => {
  it("compounds a lump sum monthly", () => {
    const { finalBalance, totalInterest } = projectVault({ principal: 1000, apy: 12, months: 12 });
    // 1000 × (1 + 0.01)^12 = 1126.83
    expect(finalBalance).toBeCloseTo(1126.83, 2);
    expect(totalInterest).toBeCloseTo(126.83, 2);
  });

  it("counts recurring contributions as principal, not interest", () => {
    const result = projectVault({ principal: 0, monthlyContribution: 100, apy: 6, months: 12 });
    expect(result.totalContributions).toBe(1200);
    expect(result.finalBalance).toBeGreaterThan(1230);
    expect(result.totalInterest).toBeCloseTo(result.finalBalance - 1200, 2);
  });

  it("returns the principal untouched with no rate or horizon", () => {
    expect(projectVault({ principal: 500, apy: 0, months: 0 }).finalBalance).toBe(500);
    expect(projectVault({ principal: 500, apy: 0, months: 24 }).finalBalance).toBe(500);
  });

  it("emits one point per month plus the starting point", () => {
    const { points } = projectVault({ principal: 100, apy: 5, months: 6 });
    expect(points).toHaveLength(7);
    expect(points[0]?.month).toBe(0);
    expect(points[6]?.month).toBe(6);
  });

  it("guards against negative inputs", () => {
    const result = projectVault({ principal: -100, monthlyContribution: -50, apy: 5, months: 3 });
    expect(result.finalBalance).toBe(0);
    expect(result.totalContributions).toBe(0);
  });

  it("maps contribution frequency onto a monthly equivalent", () => {
    expect(projectMonths("MONTHLY")).toBe(12);
    expect(projectMonths("WEEKLY")).toBe(52);
    expect(projectMonths("DAILY")).toBe(365);
  });
});
