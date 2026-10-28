/** Projected growth of a savings vault. Pure, so the calculator is testable. */

export type ProjectionInput = {
  principal: number;
  monthlyContribution?: number;
  /** Annual percentage yield, e.g. 4.85 for 4.85%. */
  apy: number;
  months: number;
};

export type ProjectionPoint = { month: number; balance: number; contributions: number; interest: number };

export type Projection = {
  points: ProjectionPoint[];
  finalBalance: number;
  totalContributions: number;
  totalInterest: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Compounds monthly at `apy / 12`, adding the contribution at the start of each
 * month so a monthly schedule earns interest in the month it is paid.
 */
export function projectVault({ principal, monthlyContribution = 0, apy, months }: ProjectionInput): Projection {
  const safeMonths = Math.max(0, Math.floor(months));
  const monthlyRate = apy / 100 / 12;
  let balance = Math.max(0, principal);
  let contributions = Math.max(0, principal);
  const points: ProjectionPoint[] = [
    { month: 0, balance: round2(balance), contributions: round2(contributions), interest: 0 },
  ];

  for (let month = 1; month <= safeMonths; month += 1) {
    balance += Math.max(0, monthlyContribution);
    contributions += Math.max(0, monthlyContribution);
    balance *= 1 + monthlyRate;
    points.push({
      month,
      balance: round2(balance),
      contributions: round2(contributions),
      interest: round2(balance - contributions),
    });
  }

  const final = points[points.length - 1]!;
  return {
    points,
    finalBalance: final.balance,
    totalContributions: final.contributions,
    totalInterest: final.interest,
  };
}

export function projectMonths(frequency: "DAILY" | "WEEKLY" | "MONTHLY", horizonYears = 1): number {
  if (frequency === "DAILY") return Math.round(365 * horizonYears);
  if (frequency === "WEEKLY") return Math.round(52 * horizonYears);
  return Math.round(12 * horizonYears);
}
