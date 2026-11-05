import { describe, expect, it } from "vitest";

import { HISTORY_LIMIT, MarketEngine } from "../realtime/engine.js";

const engine = () => {
  const market = new MarketEngine([{ symbol: "BTC", price: 100 }], 60_000);
  market.start();
  market.stop();
  return market;
};

describe("matching engine", () => {
  it("builds a crossed-free book with a positive spread", () => {
    const depth = engine().depth("BTC");
    expect(depth.bids.length).toBeGreaterThan(0);
    expect(depth.asks.length).toBeGreaterThan(0);
    expect(depth.bids[0]!.price).toBeLessThan(depth.asks[0]!.price);
    expect(depth.spread).toBeGreaterThan(0);
  });

  it("fills market orders immediately at the ticker price", () => {
    const market = engine();
    const order = market.placeOrder({ userId: "u1", symbol: "BTC", side: "BUY", kind: "MARKET", price: 0, quantity: 1 });
    expect(order.status).toBe("FILLED");
    expect(order.filled).toBe(1);
    expect(market.openOrders("u1")).toHaveLength(0);
  });

  it("keeps a non-marketable limit order open and releases it on cancel", () => {
    const market = engine();
    const order = market.placeOrder({ userId: "u1", symbol: "BTC", side: "BUY", kind: "LIMIT", price: 1, quantity: 2 });
    expect(order.status).toBe("OPEN");
    expect(market.openOrders("u1")).toHaveLength(1);
    expect(market.cancelOrder(order.id)?.status).toBe("CANCELLED");
    expect(market.openOrders("u1")).toHaveLength(0);
    expect(market.cancelOrder(order.id)).toBeNull();
  });

  it("emits ticker events on each tick", async () => {
    const market = new MarketEngine([{ symbol: "ETH", price: 2000 }], 10);
    market.start();
    const tick = await new Promise<{ symbol: string; price: number }>((resolve) => {
      market.once("ticker", resolve);
    });
    market.stop();
    expect(tick.symbol).toBe("ETH");
    expect(tick.price).toBeGreaterThan(0);
  });
});

describe("candle history", () => {
  it("backfills a continuous series that ends at the seeded price", () => {
    const market = new MarketEngine([{ symbol: "BTC", price: 100 }], 60_000);
    for (const timeframe of ["1H", "4H", "1D", "1W"] as const) {
      const candles = market.candles("BTC", timeframe);
      expect(candles).toHaveLength(HISTORY_LIMIT);
      expect(candles[candles.length - 1]!.close).toBe(100);
      for (let index = 1; index < candles.length; index += 1) {
        expect(candles[index]!.time).toBeGreaterThan(candles[index - 1]!.time);
        expect(candles[index]!.high).toBeGreaterThanOrEqual(candles[index]!.low);
      }
    }
  });

  it("extends the newest bucket rather than appending a candle per tick", async () => {
    const market = new MarketEngine([{ symbol: "BTC", price: 100 }], 10);
    // Snapshot the values: `candles()` returns references to the live buckets.
    const before = { ...market.candles("BTC", "1H").at(-1)! };
    market.start();
    await new Promise((resolve) => market.once("ticker", resolve));
    market.stop();
    const after = market.candles("BTC", "1H").at(-1)!;
    expect(after.time).toBe(before.time);
    expect(after.high).toBeGreaterThanOrEqual(Math.max(before.open, before.close));
    expect(after.volume).toBeGreaterThan(before.volume);
  });

  it("clamps the requested limit and publishes sparkline closes", () => {
    const market = new MarketEngine([{ symbol: "BTC", price: 100 }], 60_000);
    expect(market.candles("BTC", "1H", 5)).toHaveLength(5);
    expect(market.candles("BTC", "1H", 9_999)).toHaveLength(HISTORY_LIMIT);
    expect(market.sparkline("BTC", 10)).toHaveLength(10);
    expect(market.candles("UNKNOWN", "1H")).toEqual([]);
  });
});
