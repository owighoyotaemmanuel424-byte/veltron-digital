import { describe, expect, it } from "vitest";
import {
  advanceOpenOrders,
  applyOrderToBalances,
  applyPriceToCandle,
  buildCandles,
  buildOrderBook,
  createAssets,
  equity,
  formatPrice,
  maxAmount,
  nextPrice,
  quoteOrder,
  seededRandom,
  seedBalances,
  spread,
  tickAsset,
  TIMEFRAMES,
  timeframeMeta,
  updateOrderBook,
  type Balances,
  type OpenOrder,
} from "./crypto";

const balances: Balances = { usd: 1000, assets: { BTC: 0.5, ETH: 2 } };

describe("market seed", () => {
  it("is deterministic for a fixed seed", () => {
    const left = createAssets(seededRandom(42));
    const right = createAssets(seededRandom(42));
    expect(left.map((asset) => asset.price)).toEqual(right.map((asset) => asset.price));
  });

  it("returns ten assets with a usable sparkline", () => {
    const assets = createAssets();
    expect(assets).toHaveLength(10);
    for (const asset of assets) {
      expect(asset.sparkline.length).toBeGreaterThan(10);
      expect(asset.sparkline.at(-1)).toBe(asset.price);
      expect(asset.open).toBeGreaterThan(0);
    }
  });

  it("rounds a price tick and keeps it inside the session band", () => {
    const random = seededRandom(7);
    const asset = createAssets()[0];
    let price = asset.price;
    for (let index = 0; index < 500; index += 1) {
      price = nextPrice({ ...asset, price }, random);
      expect(price).toBeGreaterThanOrEqual(asset.open * 0.65 - 1e-9);
      expect(price).toBeLessThanOrEqual(asset.open * 1.35 + 1e-9);
    }
  });

  it("rolls the sparkline forward one point per tick", () => {
    const asset = createAssets()[0];
    const next = tickAsset(asset, seededRandom(3));
    expect(next.sparkline).toHaveLength(asset.sparkline.length);
    expect(next.sparkline.at(-1)).toBe(next.price);
    expect(next.sparkline[0]).toBe(asset.sparkline[1]);
  });
});

describe("order book", () => {
  it("sorts bids down and asks up around the mid", () => {
    const book = buildOrderBook(100, seededRandom(9), 2, 8);
    const bidPrices = book.bids.map((level) => level.price);
    const askPrices = book.asks.map((level) => level.price);
    expect([...bidPrices].sort((a, b) => b - a)).toEqual(bidPrices);
    expect([...askPrices].sort((a, b) => a - b)).toEqual(askPrices);
    expect(Math.max(...bidPrices)).toBeLessThan(Math.min(...askPrices));
    expect(spread(book)).toBeGreaterThan(0);
  });

  it("accumulates depth totals", () => {
    const book = buildOrderBook(250, seededRandom(11), 2, 6);
    expect(book.bids[0].total).toBe(book.bids[0].size);
    expect(book.bids.at(-1)!.total).toBeGreaterThan(book.bids[0].total);
    expect(book.asks.at(-1)!.total).toBeGreaterThan(book.asks[0].total);
  });

  it("re-centres an existing book without losing levels or ordering", () => {
    const book = buildOrderBook(100, seededRandom(13), 2, 6);
    const moved = updateOrderBook(book, 101.5, seededRandom(17), 2);
    expect(moved.bids).toHaveLength(book.bids.length);
    expect(moved.asks).toHaveLength(book.asks.length);
    expect(moved.bids[0].price).toBeCloseTo(book.bids[0].price + 1.5, 2);
    expect(moved.bids[0].price).toBeLessThan(moved.asks[0].price);
  });
});

describe("candles", () => {
  it("closes on the reference price and keeps OHLC sane", () => {
    const asset = createAssets()[0];
    const candles = buildCandles({ price: asset.open, volatility: asset.volatility, precision: asset.precision }, "1H", seededRandom(5));
    expect(candles).toHaveLength(96);
    for (const candle of candles) {
      expect(candle.low).toBeLessThanOrEqual(Math.min(candle.open, candle.close));
      expect(candle.high).toBeGreaterThanOrEqual(Math.max(candle.open, candle.close));
      expect(candle.volume).toBeGreaterThan(0);
      expect(candle.open).toBeGreaterThan(0);
    }
    expect(candles.at(-1)!.close).toBeCloseTo(asset.open, asset.precision);
  });

  it("spaces candles by the timeframe interval", () => {
    const asset = createAssets()[0];
    for (const timeframe of TIMEFRAMES.map((entry) => entry.id)) {
      const candles = buildCandles({ price: asset.open, volatility: asset.volatility, precision: asset.precision }, timeframe, seededRandom(5));
      const step = candles[1].time - candles[0].time;
      expect(step).toBe(timeframeMeta(timeframe).ms / 1000);
      expect(candles.every((candle, index) => index === 0 || candle.time > candles[index - 1].time)).toBe(true);
    }
  });

  it("extends the live candle without moving its open", () => {
    const candle = { time: 1, open: 100, high: 105, low: 98, close: 102, volume: 10 };
    const raised = applyPriceToCandle(candle, 110, 2);
    expect(raised.open).toBe(100);
    expect(raised.high).toBe(110);
    expect(raised.close).toBe(110);
    const lowered = applyPriceToCandle(candle, 95, 2);
    expect(lowered.low).toBe(95);
    expect(lowered.close).toBe(95);
    expect(lowered.high).toBe(105);
  });
});

describe("order maths", () => {
  it("adds the fee to a buy and subtracts it from a sell", () => {
    const buy = quoteOrder("Buy", 2, 100);
    expect(buy.gross).toBe(200);
    expect(buy.fee).toBeCloseTo(0.2, 6);
    expect(buy.total).toBeCloseTo(200.2, 6);

    const sell = quoteOrder("Sell", 2, 100);
    expect(sell.fee).toBeCloseTo(0.2, 6);
    expect(sell.total).toBeCloseTo(199.8, 6);
  });

  it("caps a buy at the cash balance including the fee", () => {
    const amount = maxAmount(balances, "BTC", "Buy", 100, 100);
    expect(quoteOrder("Buy", amount, 100).total).toBeCloseTo(1000, 6);
    expect(maxAmount(balances, "BTC", "Buy", 100, 25)).toBeCloseTo(amount / 4, 6);
  });

  it("caps a sell at the asset balance", () => {
    expect(maxAmount(balances, "BTC", "Sell", 100, 50)).toBeCloseTo(0.25, 6);
    expect(maxAmount(balances, "ETH", "Sell", 100, 100)).toBeCloseTo(2, 6);
  });

  it("moves cash and units in opposite directions", () => {
    const bought = applyOrderToBalances(balances, { side: "Buy", symbol: "BTC", amount: 0.1, price: 100 });
    expect(bought.usd).toBeCloseTo(1000 - 10.01, 6);
    expect(bought.assets.BTC).toBeCloseTo(0.6, 6);

    const sold = applyOrderToBalances(balances, { side: "Sell", symbol: "BTC", amount: 0.1, price: 100 });
    expect(sold.usd).toBeCloseTo(1000 + 9.99, 6);
    expect(sold.assets.BTC).toBeCloseTo(0.4, 6);
  });

  it("never sells below zero units", () => {
    const sold = applyOrderToBalances({ usd: 0, assets: { BTC: 0.1 } }, { side: "Sell", symbol: "BTC", amount: 5, price: 100 });
    expect(sold.assets.BTC).toBe(0);
  });

  it("values equity as cash plus holdings", () => {
    const assets = createAssets();
    const wallet = seedBalances(assets);
    const expected = wallet.usd + assets.reduce((sum, asset) => sum + wallet.assets[asset.symbol] * asset.price, 0);
    expect(equity(wallet, assets)).toBeCloseTo(expected, 6);
  });
});

describe("simulated fills", () => {
  it("partially fills some orders and reports completed ones", () => {
    const orders: OpenOrder[] = [
      { id: "A", symbol: "BTC", side: "Buy", kind: "Limit", price: 100, amount: 1, filled: 0, status: "Open", placedAt: "2026-10-27T08:00:00Z" },
    ];
    const random = seededRandom(1);
    let current = orders;
    let completed = 0;
    for (let tick = 0; tick < 4000; tick += 1) {
      const result = advanceOpenOrders(current, random);
      completed += result.filled.length;
      current = result.orders;
      for (const order of current) expect(order.filled).toBeLessThan(order.amount);
      if (current.length === 0) break;
    }
    expect(completed).toBe(1);
    expect(current).toHaveLength(0);
  });
});

describe("formatting", () => {
  it("keeps the configured precision for tiny prices", () => {
    expect(formatPrice(0.3182, 4)).toBe("$0.3182");
    expect(formatPrice(61284.5, 2)).toBe("$61,284.50");
  });
});
