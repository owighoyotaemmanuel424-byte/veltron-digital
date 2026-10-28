import { Prisma } from "@prisma/client";

import type { Tx } from "../db.js";
import { FACTOR, formatAmount, parseAmount } from "../lib/money.js";
import { postTransaction, systemAccountKey, walletAccountKey } from "./ledger.js";

/**
 * Savings vault accrual.
 *
 * Interest is computed in integer minor units with half-up rounding, then posted
 * through the ledger as a balanced pair (vault wallet debit / system yield
 * credit). Each hourly bucket has a deterministic reference so a retried job
 * cannot double-credit a vault.
 */

const HOURS_PER_YEAR = 365n * 24n;

export function accrueInterest(balanceMinor: bigint, apyRate: string, hours: number): bigint {
  if (balanceMinor <= 0n || hours <= 0) return 0n;
  const apy = parseAmount(apyRate); // APY as percent, scaled by 1e8
  const hoursMinor = BigInt(Math.floor(hours * 1_000_000));
  const numerator = balanceMinor * apy * hoursMinor;
  const denominator = FACTOR * 100n * HOURS_PER_YEAR * 1_000_000n;
  const product = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder * 2n >= denominator ? product + 1n : product;
}

export function hourBucket(date: Date): string {
  return `${date.toISOString().slice(0, 13)}`;
}

export type AccrualSummary = { processed: number; creditedMinor: bigint; skipped: number };

export async function runVaultAccruals(
  db: Tx,
  currencyCode = "USD",
  now: Date = new Date(),
): Promise<AccrualSummary> {
  const vaults = await db.savingsVault.findMany({
    where: { currentBalance: { gt: new Prisma.Decimal(0) } },
    select: { id: true, userId: true, currentBalance: true, apyRate: true, lastAccruedAt: true },
    take: 500,
  });

  const summary: AccrualSummary = { processed: 0, creditedMinor: 0n, skipped: 0 };

  for (const vault of vaults) {
    const last = vault.lastAccruedAt ?? new Date(now.getTime() - 60 * 60 * 1000);
    const elapsedHours = (now.getTime() - last.getTime()) / 3_600_000;
    if (elapsedHours < 1) {
      summary.skipped += 1;
      continue;
    }

    const balanceMinor = parseAmount(vault.currentBalance.toFixed(8));
    const interestMinor = accrueInterest(balanceMinor, vault.apyRate.toFixed(2), Math.min(elapsedHours, 24 * 31));
    if (interestMinor <= 0n) {
      summary.skipped += 1;
      continue;
    }

    const wallet = await db.wallet.findUnique({
      where: { unique_user_currency: { userId: vault.userId, currencyCode } },
      select: { id: true },
    });
    if (!wallet) {
      summary.skipped += 1;
      continue;
    }

    const amount = formatAmount(interestMinor);
    await postTransaction(db, {
      reference: `vault-interest:${vault.id}:${hourBucket(now)}`,
      description: `Vault interest accrual (${vault.apyRate.toFixed(2)}% APY)`,
      postings: [
        { accountKey: walletAccountKey(wallet.id), currencyCode, amount },
        { accountKey: systemAccountKey("vault-yield"), currencyCode, amount: formatAmount(-interestMinor) },
      ],
    });

    await db.savingsVault.update({
      where: { id: vault.id },
      data: { currentBalance: { increment: new Prisma.Decimal(amount) }, lastAccruedAt: now },
    });

    summary.processed += 1;
    summary.creditedMinor += interestMinor;
  }

  return summary;
}
