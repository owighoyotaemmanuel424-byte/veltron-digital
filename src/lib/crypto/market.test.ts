import { describe, expect, it } from "vitest";

import {
  FEE_RATE,
  applyPriceToCandle,
  change24h,
  formatClock,
  formatPercent,
  holdingValue,
  maxAmount,
  quoteOrder,
  spread,
  spreadPercent,
  toAsset,
  toAssets,
  toBalances,
  toBook,
  toCandles,
  toOpenOrders,
  type Asset,
  type Candle,
} from "./market";

describe("toAsset", () => {
  it("derives the 24h open from the engine percentage", () => {
    const asset = toAsset({ symbol: "BTC", price: 110, change24h: 10, bid: 109, ask: 111, at: 1 });
    expect(asset?.open).toBeCloseTo(100, 6);
    expect(change24h(asset!)).toBeCloseTo(10, 6);
    expect(asset?.name).toBe("Bitcoin");
    expect(asset?.precision).toBe(2);
  });

  it("handles a zero change and a missing symbol", () => {
    expect(toAsset({ symbol: "SOL", price: 150, change24h: 0, bid: 149, ask: 151, at: 1 })?.open).toBe(150);
    expect(toAsset({ symbol: "", price: 1, change24h: 0, bid: 1, ask: 1, at: 1 })).toBeNull();
  });

  it("sorts assets and drops malformed rows", () => {
    const assets = toAssets({
      markets: [
        { symbol: "SOL", price: 150, change24h: 0, bid: 1, ask: 2, at: 1 },
        { symbol: "BTC", price: 60000, change24h: 1, bid: 1, ask: 2, at: 1 },
        { price: 3 },
      ],
    });
    expect(assets.map((asset) => asset.symbol)).toEqual(["BTC", "SOL"]);
  });
});

describe("toBalances", () => {
  it("sums USD and maps the other currencies as holdings", () => {
    const balances = toBalances({
      wallets: [
        { id: "1", currencyCode: "USD", balance: "1000.5" },
        { id: "2", currencyCode: "USD", balance: 20 },
        { id: "3", currencyCode: "BTC", balance: "0.25" },
        { id: "4", currencyCode: "USDT", balance: "10" },
      ],
    });
    expect(balances.usd).toBe(1020.5);
    expect(balances.assets.BTC).toBe(0.25);
    expect(balances.assets.USDT).toBe(10);
  });

  it("returns empty balances for an unexpected payload", () => {
    expect(toBalances({})).toEqual({ usd: 0, assets: {} });
  });
});

describe("toOpenOrders", () => {
  it("keeps only resting orders and maps engine enums", () => {
    const orders = toOpenOrders({
      orders: [
        { id: "a", symbol: "BTC", side: "BUY", kind: "LIMIT", price: 100, quantity: 1, filled: 0, status: "OPEN", createdAt: 1000 },
        { id: "b", symbol: "ETH", side: "SELL", kind: "MARKET", price: 2000, quantity: 2, filled: 0.5, status: "OPEN", createdAt: 2000 },
        { id: "c", symbol: "SOL", side: "BUY", kind: "LIMIT", price: 10, quantity: 1, filled: 1, status: "FILLED", createdAt: 3000 },
      ],
    });
    expect(orders).toHaveLength(2);
    expect(orders[0]).toMatchObject({ id: "b", side: "Sell", kind: "Market", status: "Partial" });
    expect(orders[1]).toMatchObject({ id: "a", side: "Buy", kind: "Limit", status: "Open" });
    expect(orders[0].placedAt).toBe(new Date(2000).toISOString());
  });
});

describe("toBook", () => {
  it("accumulates depth totals and caps the level count", () => {
    const bids = Array.from({ length: 14 }, (_, index) => ({ price: 100 - index, quantity: 1 }));
    const book = toBook({ symbol: "BTC", bids, asks: [{ price: 200, quantity: 2 }], spread: 100 }, 2);
    expect(book.bids).toHaveLength(10);
    expect(book.bids[2].total).toBe(3);
    expect(book.asks[0]).toEqual({ price: 200, size: 2, total: 2 });
    expect(spread(book)).toBe(100);
    expect(spreadPercent(book)).toBeCloseTo(50, 6);
  });

  it("survives a missing payload", () => {
    expect(toBook(undefined)).toEqual({ bids: [], asks: [] });
    expect(spread({ bids: [], asks: [] })).toBe(0);
    expect(spreadPercent({ bids: [], asks: [] })).toBe(0);
  });
});

describe("toCandles", () => {
  it("normalizes numbers and rejects rows without a time", () => {
    const candles = toCandles({
      candles: [
        { time: 1, open: "1", high: 2, low: 0.5, close: 1.5, volume: "3" },
        { open: 1, high: 1, low: 1, close: 1, volume: 1 },
      ],
    });
    expect(candles).toEqual([{ time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 3 }]);
  });

  it("extends the newest candle without shrinking its range", () => {
    const candle: Candle = { time: 10, open: 100, high: 105, low: 95, close: 101, volume: 2 };
    expect(applyPriceToCandle(candle, 99, 2)).toMatchObject({ close: 99, high: 105, low: 95 });
    expect(applyPriceToCandle(candle, 110, 2)).toMatchObject({ close: 110, high: 110, low: 95 });
  });
});

describe("order maths", () => {
  it("charges no engine fee, matching what the platform locks", () => {
    expect(FEE_RATE).toBe(0);
    expect(quoteOrder("Buy", 2, 100)).toEqual({ gross: 200, fee: 0, total: 200 });
    expect(quoteOrder("Sell", 2, 100).total).toBe(200);
  });

  it("sizes orders from the available side of the balance", () => {
    const balances = { usd: 1000, assets: { BTC: 2 } };
    expect(maxAmount(balances, "BTC", "Buy", 100, 50)).toBeCloseTo(5, 8);
    expect(maxAmount(balances, "BTC", "Sell", 100, 25)).toBeCloseTo(0.5, 8);
    expect(maxAmount(balances, "BTC", "Buy", 0, 50)).toBe(0);
    expect(maxAmount(balances, "BTC", "Buy", 100, 250)).toBeCloseTo(10, 8);
  });

  it("values a holding at the live price", () => {
    const asset = { symbol: "BTC", price: 100 } as Asset;
    expect(holdingValue({ usd: 0, assets: { BTC: 0.5 } }, asset)).toBe(50);
  });
});

describe("formatting", () => {
  it("prints UTC clock times and percentages", () => {
    expect(formatClock("2026-10-27T08:12:00Z")).toBe("08:12 UTC");
    expect(formatClock("not-a-date")).toBe("—");
    expect(formatPercent(1.234)).toBe("+1.23%");
    expect(formatPercent(-1.234)).toBe("−1.23%");
  });
});
