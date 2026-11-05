import { EventEmitter } from "node:events";

/**
 * In-process matching engine and market-data feed.
 *
 * The engine owns the authoritative book per symbol, walks price with a random
 * walk on a timer, matches resting limit orders whenever the price crosses them,
 * and emits `ticker`, `book` and `fill` events that the WebSocket server relays.
 * A production deployment swaps the in-memory book for Redis-backed state; the
 * event contract stays the same.
 */

export type Side = "BUY" | "SELL";
export type OrderKind = "MARKET" | "LIMIT";

export type BookLevel = { price: number; quantity: number };

export type Ticker = { symbol: string; price: number; change24h: number; bid: number; ask: number; at: number };

export type EngineOrder = {
  id: string;
  userId: string;
  symbol: string;
  side: Side;
  kind: OrderKind;
  price: number;
  quantity: number;
  filled: number;
  status: "OPEN" | "FILLED" | "CANCELLED";
  createdAt: number;
};

export type Fill = { orderId: string; userId: string; symbol: string; side: Side; price: number; quantity: number; at: number };

export type Timeframe = "1H" | "4H" | "1D" | "1W";
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

/** Bucket width per timeframe, in milliseconds. */
export const TIMEFRAME_MS: Record<Timeframe, number> = {
  "1H": 60 * 60 * 1000,
  "4H": 4 * 60 * 60 * 1000,
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
};

export const TIMEFRAMES = Object.keys(TIMEFRAME_MS) as Timeframe[];

const DEPTH = 12;
/** Candles retained per symbol and timeframe. */
export const HISTORY_LIMIT = 120;
const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

/** Small deterministic PRNG so a process seeds identical backfill history. */
function seeded(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export class MarketEngine extends EventEmitter {
  private readonly prices = new Map<string, number>();
  private readonly opens = new Map<string, number>();
  private readonly books = new Map<string, { bids: BookLevel[]; asks: BookLevel[] }>();
  private readonly orders = new Map<string, EngineOrder>();
  private readonly candleSeries = new Map<string, Map<Timeframe, Candle[]>>();
  private timer?: NodeJS.Timeout;

  constructor(
    seeds: { symbol: string; price: number }[],
    private readonly tickMs = 750,
  ) {
    super();
    for (const seed of seeds) {
      this.prices.set(seed.symbol, seed.price);
      this.opens.set(seed.symbol, seed.price);
      this.seedBook(seed.symbol, seed.price);
      this.seedHistory(seed.symbol, seed.price);
    }
  }

  /**
   * The engine is the only price source in the platform, so it also owns the
   * OHLC history the charts read. On boot each symbol gets a bounded backfill
   * that ends exactly at its seeded price; every subsequent tick extends the
   * newest bucket, so the series is continuous rather than reseeded per request.
   */
  private seedHistory(symbol: string, price: number) {
    const series = new Map<Timeframe, Candle[]>();
    const random = seeded(symbol.split("").reduce((hash, char) => hash + char.charCodeAt(0), 1));
    const now = Date.now();
    for (const timeframe of TIMEFRAMES) {
      const ms = TIMEFRAME_MS[timeframe];
      const endBucket = Math.floor(now / ms) * ms;
      const stepVol = Math.min(0.02, 0.0012 * Math.sqrt(ms / (60 * 60 * 1000)));
      const rows: { open: number; high: number; low: number; close: number; volume: number }[] = [];
      let close = price;
      // Walk backwards from the live price so the newest close is exact, then reverse.
      for (let index = 0; index < HISTORY_LIMIT; index += 1) {
        const open = close / (1 + (random() - 0.5) * 2 * stepVol);
        const high = Math.max(open, close) * (1 + random() * stepVol * 0.9);
        const low = Math.min(open, close) * (1 - random() * stepVol * 0.9);
        rows.push({ open, high, low, close, volume: round(2 + random() * 9, 2) });
        close = open;
      }
      rows.reverse();
      series.set(
        timeframe,
        rows.map((row, index) => ({
          time: Math.floor((endBucket - (HISTORY_LIMIT - 1 - index) * ms) / 1000),
          open: round(row.open, 2),
          high: round(row.high, 2),
          low: round(row.low, 2),
          close: round(row.close, 2),
          volume: row.volume,
        })),
      );
    }
    this.candleSeries.set(symbol, series);
  }

  /** Folds one print into every timeframe bucket for the symbol. */
  private recordPrint(symbol: string, price: number) {
    const series = this.candleSeries.get(symbol);
    if (!series) return;
    const now = Date.now();
    for (const timeframe of TIMEFRAMES) {
      const ms = TIMEFRAME_MS[timeframe];
      const bucket = Math.floor(now / ms) * ms;
      const candles = series.get(timeframe);
      if (!candles) continue;
      const last = candles[candles.length - 1];
      const printed = round(price, 2);
      const volume = round(0.05 + Math.random() * 0.6, 4);
      if (last && last.time * 1000 === bucket) {
        last.close = printed;
        last.high = Math.max(last.high, printed);
        last.low = Math.min(last.low, printed);
        last.volume = round(last.volume + volume, 4);
        continue;
      }
      candles.push({
        time: bucket / 1000,
        open: last?.close ?? printed,
        high: Math.max(last?.close ?? printed, printed),
        low: Math.min(last?.close ?? printed, printed),
        close: printed,
        volume,
      });
      while (candles.length > HISTORY_LIMIT) candles.shift();
    }
  }

  candles(symbol: string, timeframe: Timeframe = "1H", limit = HISTORY_LIMIT): Candle[] {
    const series = this.candleSeries.get(symbol)?.get(timeframe) ?? [];
    return series.slice(-Math.max(1, Math.min(limit, HISTORY_LIMIT)));
  }

  /** Recent 1H closes, oldest first, for the watchlist sparkline. */
  sparkline(symbol: string, points = 24): number[] {
    return this.candles(symbol, "1H", points).map((candle) => candle.close);
  }

  private seedBook(symbol: string, price: number) {
    const bids: BookLevel[] = [];
    const asks: BookLevel[] = [];
    for (let level = 0; level < DEPTH; level += 1) {
      const step = price * 0.0004 * (level + 1);
      bids.push({ price: round(price - step), quantity: round(0.05 + Math.random() * 1.4, 6) });
      asks.push({ price: round(price + step), quantity: round(0.05 + Math.random() * 1.4, 6) });
    }
    this.books.set(symbol, { bids, asks });
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.tickMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  symbols(): string[] {
    return [...this.prices.keys()];
  }

  ticker(symbol: string): Ticker {
    const price = this.price(symbol);
    const open = this.opens.get(symbol) ?? price;
    const book = this.books.get(symbol);
    return {
      symbol,
      price: round(price, 2),
      change24h: round(((price - open) / open) * 100, 2),
      bid: book?.bids[0]?.price ?? round(price * 0.999, 2),
      ask: book?.asks[0]?.price ?? round(price * 1.001, 2),
      at: Date.now(),
    };
  }

  tickers(): Ticker[] {
    return this.symbols().map((symbol) => this.ticker(symbol));
  }

  depth(symbol: string): { symbol: string; bids: BookLevel[]; asks: BookLevel[]; spread: number } {
    const book = this.books.get(symbol) ?? { bids: [], asks: [] };
    const spread = round((book.asks[0]?.price ?? 0) - (book.bids[0]?.price ?? 0), 2);
    return { symbol, bids: book.bids.slice(0, DEPTH), asks: book.asks.slice(0, DEPTH), spread };
  }

  private price(symbol: string): number {
    return this.prices.get(symbol) ?? 0;
  }

  private tick() {
    for (const symbol of this.symbols()) {
      const current = this.price(symbol);
      // Mean-reverting random walk keeps demo prices plausible over long runs.
      const drift = (Math.random() - 0.5) * 0.0025;
      const pull = ((this.opens.get(symbol) ?? current) - current) / current * 0.02;
      const next = Math.max(0.01, current * (1 + drift + pull));
      this.prices.set(symbol, next);
      this.seedBook(symbol, next);
      this.recordPrint(symbol, next);
      this.matchResting(symbol, next);
      this.emit("ticker", this.ticker(symbol));
      this.emit("book", this.depth(symbol));
    }
  }

  placeOrder(input: Omit<EngineOrder, "id" | "filled" | "status" | "createdAt">): EngineOrder {
    const order: EngineOrder = {
      ...input,
      id: crypto.randomUUID(),
      filled: 0,
      status: "OPEN",
      createdAt: Date.now(),
    };

    if (order.kind === "MARKET") {
      order.filled = order.quantity;
      order.status = "FILLED";
      this.orders.set(order.id, order);
      this.emit("fill", this.fillFor(order, this.price(order.symbol)));
      return order;
    }

    // Marketable limit orders fill immediately against the touch.
    const book = this.books.get(order.symbol);
    const crosses = order.side === "BUY" ? (book?.asks[0]?.price ?? Infinity) <= order.price : (book?.bids[0]?.price ?? 0) >= order.price;
    this.orders.set(order.id, order);
    if (crosses) {
      order.filled = order.quantity;
      order.status = "FILLED";
      this.emit("fill", this.fillFor(order, order.price));
    }
    this.emit("orders", this.openOrders());
    return order;
  }

  cancelOrder(id: string): EngineOrder | null {
    const order = this.orders.get(id);
    if (!order || order.status !== "OPEN") return null;
    order.status = "CANCELLED";
    this.orders.set(id, order);
    this.emit("orders", this.openOrders());
    return order;
  }

  openOrders(userId?: string): EngineOrder[] {
    return [...this.orders.values()].filter(
      (order) => order.status === "OPEN" && (!userId || order.userId === userId),
    );
  }

  private fillFor(order: EngineOrder, price: number): Fill {
    return {
      orderId: order.id,
      userId: order.userId,
      symbol: order.symbol,
      side: order.side,
      price: round(price, 2),
      quantity: order.filled,
      at: Date.now(),
    };
  }

  private matchResting(symbol: string, price: number) {
    for (const order of this.orders.values()) {
      if (order.symbol !== symbol || order.status !== "OPEN") continue;
      const crossed = order.side === "BUY" ? price <= order.price : price >= order.price;
      if (!crossed) continue;
      order.filled = order.quantity;
      order.status = "FILLED";
      this.emit("fill", this.fillFor(order, order.price));
    }
    this.emit("orders", this.openOrders());
  }
}
