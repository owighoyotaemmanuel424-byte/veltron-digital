/**
 * Exact-decimal helpers. All monetary arithmetic in the service happens in
 * integer minor units (1e-8) so that no floating point error can drift the
 * ledger. Values are only converted to Prisma Decimal at the persistence edge.
 */

export const SCALE = 8;
export const FACTOR = 10n ** BigInt(SCALE);
const AMOUNT_PATTERN = /^-?\d+(\.\d{1,8})?$/;

export class MoneyError extends Error {}

export function parseAmount(value: string | number | bigint): bigint {
  if (typeof value === "bigint") return value * FACTOR;
  const raw = typeof value === "number" ? value.toFixed(SCALE) : value.trim();
  if (!AMOUNT_PATTERN.test(raw)) throw new MoneyError(`Invalid amount: ${String(value)}`);
  const negative = raw.startsWith("-");
  const [whole, fraction = ""] = (negative ? raw.slice(1) : raw).split(".") as [string, string?];
  const minor = BigInt(whole) * FACTOR + BigInt((fraction ?? "").padEnd(SCALE, "0") || "0");
  return negative ? -minor : minor;
}

export function formatAmount(minor: bigint): string {
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const whole = abs / FACTOR;
  const fraction = (abs % FACTOR).toString().padStart(SCALE, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function sumAmounts(values: bigint[]): bigint {
  return values.reduce((total, value) => total + value, 0n);
}

/** Applies a decimal rate (e.g. "0.0010") to a minor-unit amount, half-up. */
export function applyRate(minor: bigint, rate: string): bigint {
  const scaled = parseRate(rate); // rate * 1e8
  const product = minor * scaled;
  const negative = product < 0n;
  const abs = negative ? -product : product;
  const rounded = (abs + FACTOR / 2n) / FACTOR;
  return negative ? -rounded : rounded;
}

export function parseRate(rate: string): bigint {
  return parseAmount(rate);
}

export function isPositive(minor: bigint): boolean {
  return minor > 0n;
}
