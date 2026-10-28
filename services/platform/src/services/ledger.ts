import { Prisma } from "@prisma/client";

import type { Tx } from "../db.js";
import { formatAmount, parseAmount, sumAmounts } from "../lib/money.js";

/**
 * Double-entry ledger.
 *
 * Every balance change is written as a set of postings inside one
 * `ledger_transactions` row. Postings are signed (debit positive, credit
 * negative) and must net to exactly zero per currency, so a user's credit is
 * always another account's debit. Rows are append-only: there is no update or
 * delete path in this module.
 */

export type PostingInput = { accountKey: string; currencyCode: string; amount: string };
export type NormalizedPosting = PostingInput & { minor: bigint; walletId: string | null };

export class LedgerError extends Error {
  constructor(
    message: string,
    readonly code: "unbalanced" | "invalid_posting" | "duplicate_reference" | "insufficient_funds",
  ) {
    super(message);
    this.name = "LedgerError";
  }
}

export const walletAccountKey = (walletId: string) => `wallet:${walletId}`;
export const systemAccountKey = (name: string) => `system:${name}`;
const WALLET_KEY = /^wallet:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function normalizePostings(postings: PostingInput[]): NormalizedPosting[] {
  if (postings.length < 2) {
    throw new LedgerError("A ledger transaction needs at least two postings", "invalid_posting");
  }
  return postings.map((posting) => {
    const accountKey = posting.accountKey.trim();
    if (!accountKey.startsWith("wallet:") && !accountKey.startsWith("system:")) {
      throw new LedgerError(`Invalid account key: ${accountKey}`, "invalid_posting");
    }
    const currencyCode = posting.currencyCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,10}$/.test(currencyCode)) {
      throw new LedgerError(`Invalid currency: ${posting.currencyCode}`, "invalid_posting");
    }
    const minor = parseAmount(posting.amount);
    if (minor === 0n) {
      throw new LedgerError("Posting amount must be non-zero", "invalid_posting");
    }
    const walletMatch = WALLET_KEY.exec(accountKey);
    return { accountKey, currencyCode, amount: posting.amount, minor, walletId: walletMatch?.[1] ?? null };
  });
}

/** Throws unless the postings sum to zero for every currency involved. */
export function assertBalanced(postings: NormalizedPosting[]): void {
  const totals = new Map<string, bigint[]>();
  for (const posting of postings) {
    const bucket = totals.get(posting.currencyCode) ?? [];
    bucket.push(posting.minor);
    totals.set(posting.currencyCode, bucket);
  }
  for (const [currency, amounts] of totals) {
    const total = sumAmounts(amounts);
    if (total !== 0n) {
      throw new LedgerError(`Unbalanced postings for ${currency}: ${formatAmount(total)}`, "unbalanced");
    }
  }
}

/** Splits an amount into the primary posting plus a fee posting, both balanced. */
export function splitWithFee(amountMinor: bigint, feeMinor: bigint): { net: string; fee: string } {
  if (feeMinor < 0n || feeMinor > amountMinor) {
    throw new LedgerError("Fee must be between zero and the amount", "invalid_posting");
  }
  return { net: formatAmount(amountMinor - feeMinor), fee: formatAmount(feeMinor) };
}

export type PostTransactionInput = {
  reference: string;
  description: string;
  postings: PostingInput[];
};

export type PostTransactionResult = { id: string; created: boolean; reference: string };

/**
 * Persists a balanced ledger group and applies the balance effects. Call inside
 * `prisma.$transaction` so the postings and the wallet updates commit together.
 */
export async function postTransaction(db: Tx, input: PostTransactionInput): Promise<PostTransactionResult> {
  const postings = normalizePostings(input.postings);
  assertBalanced(postings);

  const existing = await db.ledgerTransaction.findUnique({
    where: { reference: input.reference },
    select: { id: true, reference: true },
  });
  if (existing) return { id: existing.id, created: false, reference: existing.reference };

  let created;
  try {
    created = await db.ledgerTransaction.create({
      data: {
        reference: input.reference,
        description: input.description.slice(0, 255),
        postings: {
          create: postings.map((posting) => ({
            accountKey: posting.accountKey,
            currencyCode: posting.currencyCode,
            amount: new Prisma.Decimal(posting.amount),
            walletId: posting.walletId,
          })),
        },
      },
      select: { id: true, reference: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await db.ledgerTransaction.findUniqueOrThrow({
        where: { reference: input.reference },
        select: { id: true, reference: true },
      });
      return { id: raced.id, created: false, reference: raced.reference };
    }
    throw error;
  }

  for (const posting of postings) {
    const amount = new Prisma.Decimal(posting.amount);
    if (posting.walletId) {
      await db.wallet.update({
        where: { id: posting.walletId },
        data: { balance: { increment: amount } },
      });
    } else {
      await db.systemAccount.upsert({
        where: { key: posting.accountKey },
        create: {
          key: posting.accountKey,
          currencyCode: posting.currencyCode,
          balance: amount,
        },
        update: { balance: { increment: amount } },
      });
    }
  }

  return { id: created.id, created: true, reference: created.reference };
}

/**
 * Reserves funds for an open order: moves `available → locked` on the wallet.
 * Reserving is an availability change, not a money movement, so it produces no
 * postings; settlement later posts the real debit/credit pair.
 */
export async function lockFunds(db: Tx, walletId: string, amountMinor: bigint): Promise<void> {
  if (amountMinor <= 0n) throw new LedgerError("Lock amount must be positive", "invalid_posting");
  const wallet = await db.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true, lockedBalance: true } });
  if (wallet.balance.lessThan(new Prisma.Decimal(formatAmount(amountMinor)))) {
    throw new LedgerError("Insufficient available balance", "insufficient_funds");
  }
  const amount = new Prisma.Decimal(formatAmount(amountMinor));
  await db.wallet.update({
    where: { id: walletId },
    data: { balance: { decrement: amount }, lockedBalance: { increment: amount } },
  });
}

export async function releaseFunds(db: Tx, walletId: string, amountMinor: bigint): Promise<void> {
  if (amountMinor <= 0n) throw new LedgerError("Release amount must be positive", "invalid_posting");
  const amount = new Prisma.Decimal(formatAmount(amountMinor));
  await db.wallet.update({
    where: { id: walletId },
    data: { balance: { increment: amount }, lockedBalance: { decrement: amount } },
  });
}
