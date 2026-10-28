import { describe, expect, it } from "vitest";

import { MarketEngine } from "../realtime/engine.js";

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
