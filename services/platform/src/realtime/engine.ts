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

const DEPTH = 12;
const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

export class MarketEngine extends EventEmitter {
  private readonly prices = new Map<string, number>();
  private readonly opens = new Map<string, number>();
  private readonly books = new Map<string, { bids: BookLevel[]; asks: BookLevel[] }>();
  private readonly orders = new Map<string, EngineOrder>();
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
    }
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
