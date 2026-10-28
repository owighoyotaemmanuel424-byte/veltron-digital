import { describe, expect, it } from "vitest";

import { applyRate, formatAmount, parseAmount } from "../lib/money.js";
import { LedgerError, assertBalanced, normalizePostings, splitWithFee, walletAccountKey } from "../services/ledger.js";

const WALLET_A = "11111111-1111-4111-8111-111111111111";
const WALLET_B = "22222222-2222-4222-8222-222222222222";

describe("money", () => {
  it("round-trips decimals at 8dp", () => {
    expect(formatAmount(parseAmount("1234.56789012"))).toBe("1234.56789012");
    expect(formatAmount(parseAmount("-0.00000001"))).toBe("-0.00000001");
  });

  it("rejects malformed amounts instead of silently rounding", () => {
    expect(() => parseAmount("1.123456789")).toThrow();
    expect(() => parseAmount("abc")).toThrow();
  });

  it("applies rates with half-up rounding", () => {
    expect(formatAmount(applyRate(parseAmount("100"), "0.0010"))).toBe("0.10000000");
    expect(formatAmount(applyRate(parseAmount("1"), "0.5"))).toBe("0.50000000");
  });
});

describe("double-entry ledger", () => {
  it("accepts a balanced group", () => {
    const postings = normalizePostings([
      { accountKey: walletAccountKey(WALLET_A), currencyCode: "USD", amount: "100.00" },
      { accountKey: "system:external-fiat", currencyCode: "USD", amount: "-100.00" },
    ]);
    expect(() => assertBalanced(postings)).not.toThrow();
  });

  it("rejects a group that does not net to zero", () => {
    const postings = normalizePostings([
      { accountKey: walletAccountKey(WALLET_A), currencyCode: "USD", amount: "100.00" },
      { accountKey: "system:external-fiat", currencyCode: "USD", amount: "-99.00" },
    ]);
    expect(() => assertBalanced(postings)).toThrow(LedgerError);
  });

  it("validates balance per currency, not just in aggregate", () => {
    const postings = normalizePostings([
      { accountKey: walletAccountKey(WALLET_A), currencyCode: "USD", amount: "100" },
      { accountKey: "system:external-fiat", currencyCode: "USD", amount: "-100" },
      { accountKey: walletAccountKey(WALLET_B), currencyCode: "BTC", amount: "0.5" },
      { accountKey: "system:external-fiat", currencyCode: "BTC", amount: "-0.4" },
    ]);
    expect(() => assertBalanced(postings)).toThrow(/BTC/);
  });

  it("requires at least two postings and a known account namespace", () => {
    expect(() => normalizePostings([{ accountKey: walletAccountKey(WALLET_A), currencyCode: "USD", amount: "1" }])).toThrow();
    expect(() =>
      normalizePostings([
        { accountKey: "mystery:1", currencyCode: "USD", amount: "1" },
        { accountKey: "system:external-fiat", currencyCode: "USD", amount: "-1" },
      ]),
    ).toThrow(/Invalid account key/);
  });

  it("refuses zero-value postings so the ledger has no no-op rows", () => {
    expect(() =>
      normalizePostings([
        { accountKey: walletAccountKey(WALLET_A), currencyCode: "USD", amount: "0" },
        { accountKey: "system:external-fiat", currencyCode: "USD", amount: "0" },
      ]),
    ).toThrow(/non-zero/);
  });

  it("extracts the wallet id from the account key", () => {
    const [posting] = normalizePostings([
      { accountKey: walletAccountKey(WALLET_A), currencyCode: "USD", amount: "1" },
      { accountKey: "system:external-fiat", currencyCode: "USD", amount: "-1" },
    ]);
    expect(posting?.walletId).toBe(WALLET_A);
  });

  it("splits fees without losing a minor unit", () => {
    const { net, fee } = splitWithFee(parseAmount("1004"), parseAmount("1.5"));
    expect(fee).toBe("1.50000000");
    expect(net).toBe("1002.50000000");
    expect(parseAmount(net) + parseAmount(fee)).toBe(parseAmount("1004"));
  });

  it("rejects fees larger than the amount", () => {
    expect(() => splitWithFee(parseAmount("1"), parseAmount("2"))).toThrow(LedgerError);
  });
});
