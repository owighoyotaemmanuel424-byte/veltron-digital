// Deterministic demo market for the crypto workspace. Nothing here talks to a
// real exchange: prices follow a seeded random walk and every derived value
// (candles, order book, balances) is built from that same walk so the UI stays
// stable across reloads and unit tests.

export type Side = "Buy" | "Sell";
export type OrderKind = "Market" | "Limit";
export type Timeframe = "1H" | "4H" | "1D" | "1W";

export type Asset = {
  symbol: string;
  name: string;
  /** Price 24h ago, used for the percentage change. */
  open: number;
  price: number;
  color: string;
  precision: number;
  /** Per-tick standard deviation of the random walk. */
  volatility: number;
  /** Rolling price history for the watchlist sparkline. */
  sparkline: number[];
};

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type BookLevel = { price: number; size: number; total: number };
export type OrderBook = { bids: BookLevel[]; asks: BookLevel[] };

export type OpenOrder = {
  id: string;
  symbol: string;
  side: Side;
  kind: OrderKind;
  price: number;
  amount: number;
  filled: number;
  status: "Open" | "Partial";
  placedAt: string;
};

export type Balances = { usd: number; assets: Record<string, number> };

export type OrderInput = { symbol: string; side: Side; kind: OrderKind; amount: number; price: number };

export const FEE_RATE = 0.001;
export const BOOK_DEPTH = 10;
const SPARKLINE_POINTS = 28;
const HOUR = 60 * 60 * 1000;

/** Fixed session anchor so server and client render the same chart. */
export const MARKET_ANCHOR = Date.parse("2026-10-27T12:00:00Z");

export const TIMEFRAMES: { id: Timeframe; label: string; ms: number; candles: number }[] = [
  { id: "1H", label: "1H", ms: 5 * 60 * 1000, candles: 96 },
  { id: "4H", label: "4H", ms: 30 * 60 * 1000, candles: 96 },
  { id: "1D", label: "1D", ms: 4 * HOUR, candles: 96 },
  { id: "1W", label: "1W", ms: 12 * HOUR, candles: 84 },
];

export const timeframeMeta = (timeframe: Timeframe) => TIMEFRAMES.find((entry) => entry.id === timeframe) ?? TIMEFRAMES[0];

export function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED_ASSETS: Omit<Asset, "open" | "sparkline">[] = [
  { symbol: "BTC", name: "Bitcoin", price: 61284.5, color: "#F7931A", precision: 2, volatility: 0.0016 },
  { symbol: "ETH", name: "Ethereum", price: 3241.18, color: "#627EEA", precision: 2, volatility: 0.0022 },
  { symbol: "SOL", name: "Solana", price: 168.42, color: "#14B87A", precision: 2, volatility: 0.0034 },
  { symbol: "USDC", name: "USD Coin", price: 1, color: "#2775CA", precision: 4, volatility: 0.0004 },
  { symbol: "XRP", name: "XRP", price: 0.9421, color: "#4A5568", precision: 4, volatility: 0.0026 },
  { symbol: "ADA", name: "Cardano", price: 0.7214, color: "#0F62FE", precision: 4, volatility: 0.0029 },
  { symbol: "DOGE", name: "Dogecoin", price: 0.3182, color: "#B8860B", precision: 4, volatility: 0.0045 },
  { symbol: "AVAX", name: "Avalanche", price: 41.26, color: "#E84142", precision: 2, volatility: 0.0031 },
  { symbol: "LINK", name: "Chainlink", price: 26.84, color: "#2A5ADA", precision: 2, volatility: 0.0028 },
  { symbol: "DOT", name: "Polkadot", price: 8.63, color: "#C2185B", precision: 3, volatility: 0.003 },
];

/** Initial book for a fresh session: 24h change and a sparkline history. */
export function createAssets(random = seededRandom(20261027)): Asset[] {
  return SEED_ASSETS.map((asset) => {
    const change = (random() - 0.45) * 0.09;
    const sparkline: number[] = [];
    let value = asset.price / (1 + change);
    for (let point = 0; point < SPARKLINE_POINTS; point += 1) {
      value *= 1 + (random() - 0.5) * asset.volatility * 4;
      sparkline.push(round(value, asset.precision));
    }
    sparkline[sparkline.length - 1] = asset.price;
    return { ...asset, open: round(asset.price / (1 + change), asset.precision), sparkline };
  }).sort((left, right) => left.symbol.localeCompare(right.symbol) || left.name.localeCompare(right.name)) as Asset[];
}

export function round(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export const change24h = (asset: Asset) => (asset.open === 0 ? 0 : ((asset.price - asset.open) / asset.open) * 100);

/** One simulated socket frame: nudge a price and roll its sparkline forward. */
export function nextPrice(asset: Asset, random: () => number): number {
  const drift = (random() - 0.5) * 2 * asset.volatility;
  const next = asset.price * (1 + drift);
  // Keep the walk inside a sane band so a long demo session never drifts away.
  const ceiling = asset.open * 1.35;
  const floor = asset.open * 0.65;
  return round(Math.min(Math.max(next, floor), ceiling), asset.precision);
}

export function tickAsset(asset: Asset, random: () => number): Asset {
  const price = nextPrice(asset, random);
  const sparkline = [...asset.sparkline.slice(1 - SPARKLINE_POINTS), price];
  return { ...asset, price, sparkline };
}

export function tickAssets(assets: Asset[], random: () => number): Asset[] {
  return assets.map((asset) => tickAsset(asset, random));
}

/* ------------------------------------------------------------- order book */

export function buildOrderBook(midPrice: number, random: () => number, precision = 2, depth = BOOK_DEPTH): OrderBook {
  const step = Math.max(midPrice * 0.00018, 10 ** -precision);
  const spread = Math.max(midPrice * 0.0002, 10 ** -precision);
  const bids: BookLevel[] = [];
  const asks: BookLevel[] = [];
  let bidTotal = 0;
  let askTotal = 0;
  for (let level = 0; level < depth; level += 1) {
    const size = round((0.4 + random() * 2.4) * (60 / Math.max(midPrice, 1)) * 30, 4);
    bidTotal += size;
    const bidPrice = round(midPrice - spread / 2 - level * step, precision);
    bids.push({ price: bidPrice, size, total: round(bidTotal, 4) });

    const askSize = round((0.4 + random() * 2.4) * (60 / Math.max(midPrice, 1)) * 30, 4);
    askTotal += askSize;
    const askPrice = round(midPrice + spread / 2 + level * step, precision);
    asks.push({ price: askPrice, size: askSize, total: round(askTotal, 4) });
  }
  return { bids, asks };
}

/** Nudge an existing book to a new mid so levels keep their place between ticks. */
export function updateOrderBook(book: OrderBook, midPrice: number, random: () => number, precision = 2): OrderBook {
  const currentMid = book.bids[0] && book.asks[0] ? (book.bids[0].price + book.asks[0].price) / 2 : midPrice;
  const delta = midPrice - currentMid;
  const resized = (levels: BookLevel[]) => levels.reduce<{ levels: BookLevel[]; total: number }>((acc, level) => {
    const size = Math.max(round(level.size * (0.8 + random() * 0.45), 4), 0.0001);
    const total = acc.total + size;
    return { levels: [...acc.levels, { price: round(level.price + delta, precision), size, total: round(total, 4) }], total };
  }, { levels: [], total: 0 }).levels;
  return { bids: resized(book.bids), asks: resized(book.asks) };
}

export const spread = (book: OrderBook) => (book.asks[0] && book.bids[0] ? book.asks[0].price - book.bids[0].price : 0);
export const spreadPercent = (book: OrderBook) => {
  const bestAsk = book.asks[0]?.price;
  return bestAsk ? (spread(book) / bestAsk) * 100 : 0;
};

/* ---------------------------------------------------------------- candles */

export function buildCandles(
  asset: Pick<Asset, "price" | "volatility" | "precision">,
  timeframe: Timeframe,
  random: () => number,
  anchor = MARKET_ANCHOR,
): Candle[] {
  const { ms, candles } = timeframeMeta(timeframe);
  const endTime = Math.floor(anchor / ms) * ms;
  const stepVol = asset.volatility * Math.sqrt(ms / HOUR);
  const rows: { open: number; high: number; low: number; close: number; volume: number }[] = [];
  let close = asset.price;
  // Walk backwards from the live price, then reverse, so the last close is exact.
  for (let index = 0; index < candles; index += 1) {
    const open = close / (1 + (random() - 0.5) * 2 * stepVol);
    const high = Math.max(open, close) * (1 + random() * stepVol * 0.9);
    const low = Math.min(open, close) * (1 - random() * stepVol * 0.9);
    const volume = (asset.price > 100 ? 9 : asset.price > 1 ? 240 : 4800) * (0.35 + random() * 1.3);
    rows.push({ open, high, low, close, volume });
    close = open;
  }
  rows.reverse();
  return rows.map((row, index) => ({
    time: Math.floor((endTime - (candles - 1 - index) * ms) / 1000),
    open: round(row.open, asset.precision),
    high: round(row.high, asset.precision),
    low: round(row.low, asset.precision),
    close: round(row.close, asset.precision),
    volume: Math.round(row.volume * 100) / 100,
  }));
}

/** Extend the newest candle with a live print (used by the tick loop). */
export function applyPriceToCandle(candle: Candle, price: number, precision: number): Candle {
  return {
    ...candle,
    close: round(price, precision),
    high: round(Math.max(candle.high, price), precision),
    low: round(Math.min(candle.low, price), precision),
  };
}

/* ----------------------------------------------------------------- orders */

export type Quote = { gross: number; fee: number; total: number };
/** Market value of a fill: `total` is what leaves the wallet (buy) or lands in it (sell). */
export function quoteOrder(side: Side, amount: number, price: number, feeRate = FEE_RATE): Quote {
  const gross = amount * price;
  const fee = gross * feeRate;
  return { gross, fee, total: side === "Buy" ? gross + fee : gross - fee };
}

/** Largest order size the wallet can cover at `price` for `percent`% of the balance. */
export function maxAmount(balances: Balances, symbol: string, side: Side, price: number, percent: number, feeRate = FEE_RATE) {
  const share = Math.min(Math.max(percent, 0), 100) / 100;
  if (price <= 0) return 0;
  if (side === "Buy") return (balances.usd * share) / (price * (1 + feeRate));
  return (balances.assets[symbol] ?? 0) * share;
}

export function applyOrderToBalances(balances: Balances, order: { side: Side; symbol: string; amount: number; price: number }): Balances {
  const { total } = quoteOrder(order.side, order.amount, order.price);
  const held = balances.assets[order.symbol] ?? 0;
  return {
    usd: round(order.side === "Buy" ? balances.usd - total : balances.usd + total, 2),
    assets: {
      ...balances.assets,
      [order.symbol]: round(order.side === "Buy" ? held + order.amount : Math.max(held - order.amount, 0), 8),
    },
  };
}

export function seedBalances(assets: Asset[]): Balances {
  const holdings: Record<string, number> = { BTC: 0.1482, ETH: 1.842, SOL: 12.4, USDC: 1450, ADA: 820 };
  return {
    usd: 4820.55,
    assets: Object.fromEntries(assets.map((asset) => [asset.symbol, holdings[asset.symbol] ?? 0])),
  };
}

/** Simulated partial fills; orders that complete come back in `filled`. */
export function advanceOpenOrders(orders: OpenOrder[], random: () => number): { orders: OpenOrder[]; filled: OpenOrder[] } {
  const filled: OpenOrder[] = [];
  const remaining = orders.flatMap((order) => {
    // A resting order should stay on the book for a while: roughly one small
    // partial per 25 ticks, so a fresh order is still visible seconds later.
    if (random() > 0.04) return [order];
    const amount = order.amount * (0.05 + random() * 0.2);
    const nextFilled = Math.min(order.amount, order.filled + amount);
    if (nextFilled >= order.amount) {
      filled.push({ ...order, filled: order.amount, status: "Open" });
      return [];
    }
    return [{ ...order, filled: nextFilled, status: "Partial" as const }];
  });
  return { orders: remaining, filled };
}

export function seedOpenOrders(assets: Asset[]): OpenOrder[] {
  const pick = (index: number) => assets[index % assets.length];
  return [
    { id: "ORD-4821", symbol: pick(0).symbol, side: "Buy", kind: "Limit", price: round(pick(0).price * 0.965, pick(0).precision), amount: 0.08, filled: 0, status: "Open", placedAt: "2026-10-27T08:12:00Z" },
    { id: "ORD-4820", symbol: pick(1).symbol, side: "Sell", kind: "Limit", price: round(pick(1).price * 1.032, pick(1).precision), amount: 0.65, filled: 0.25, status: "Partial", placedAt: "2026-10-27T06:44:00Z" },
    { id: "ORD-4818", symbol: pick(2).symbol, side: "Buy", kind: "Limit", price: round(pick(2).price * 0.94, pick(2).precision), amount: 18, filled: 0, status: "Open", placedAt: "2026-10-26T20:31:00Z" },
    { id: "ORD-4815", symbol: pick(1).symbol, side: "Buy", kind: "Limit", price: round(pick(1).price * 0.92, pick(1).precision), amount: 0.4, filled: 0.5, status: "Partial", placedAt: "2026-10-26T14:02:00Z" },
  ];
}

export function equity(balances: Balances, assets: Asset[]) {
  const holdings = assets.reduce((sum, asset) => sum + (balances.assets[asset.symbol] ?? 0) * asset.price, 0);
  return holdings + balances.usd;
}

export function holdingValue(balances: Balances, asset: Asset) {
  return (balances.assets[asset.symbol] ?? 0) * asset.price;
}

/* -------------------------------------------------------------- formatting */

const usdFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const formatUsd = (value: number) => usdFormatter.format(value);
export const formatCompact = (value: number) => compactFormatter.format(value);
export const formatPrice = (value: number, precision: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: precision, maximumFractionDigits: precision }).format(value);
export const formatQty = (value: number, precision = 4) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: precision }).format(value);
export const formatPercent = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`;
export const formatClock = (iso: string) => `${iso.slice(11, 16)} UTC`;
