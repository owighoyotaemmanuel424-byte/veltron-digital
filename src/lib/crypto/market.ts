/**
 * Crypto market contract, shared by the workspace UI and the platform feed.
 *
 * Every price, depth level, candle and order in this module comes from
 * `services/platform` over REST or the `/ws` stream. There is no client-side
 * random walk and no seeded fixture: if the platform is unreachable the hook
 * reports `unavailable` and the page says so.
 *
 * `SYMBOL_META` is display metadata only (ticker name, accent colour, price
 * precision). Names and colours are not market data, so they live here rather
 * than being fetched on every tick.
 */

export type Side = "Buy" | "Sell";
export type OrderKind = "Market" | "Limit";
export type Timeframe = "1H" | "4H" | "1D" | "1W";

export type Asset = {
  symbol: string;
  name: string;
  price: number;
  /** Price at the start of the engine's 24h window, derived from `change24h`. */
  open: number;
  color: string;
  precision: number;
  /** Recent 1H closes published by the engine. */
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
  /** ISO timestamp, as rendered by the open-orders table. */
  placedAt: string;
};

export type Balances = { usd: number; assets: Record<string, number> };

export type OrderInput = { symbol: string; side: Side; kind: OrderKind; amount: number; price: number };

/** The engine locks `quantity × price` for buys and settles at the same price. */
export const FEE_RATE = 0;

export const BOOK_DEPTH = 10;

export const TIMEFRAMES: { id: Timeframe; label: string; ms: number; candles: number }[] = [
  { id: "1H", label: "1H", ms: 60 * 60 * 1000, candles: 120 },
  { id: "4H", label: "4H", ms: 4 * 60 * 60 * 1000, candles: 120 },
  { id: "1D", label: "1D", ms: 24 * 60 * 60 * 1000, candles: 120 },
  { id: "1W", label: "1W", ms: 7 * 24 * 60 * 60 * 1000, candles: 120 },
];

export const timeframeMeta = (timeframe: Timeframe) => TIMEFRAMES.find((entry) => entry.id === timeframe) ?? TIMEFRAMES[0];

/** Display metadata for the symbols the engine publishes. */
export const SYMBOL_META: Record<string, { name: string; color: string; precision: number }> = {
  BTC: { name: "Bitcoin", color: "#F7931A", precision: 2 },
  ETH: { name: "Ethereum", color: "#627EEA", precision: 2 },
  SOL: { name: "Solana", color: "#14B87A", precision: 2 },
  USDC: { name: "USD Coin", color: "#2775CA", precision: 4 },
  XRP: { name: "XRP", color: "#4A5568", precision: 4 },
  ADA: { name: "Cardano", color: "#0F62FE", precision: 4 },
  DOGE: { name: "Dogecoin", color: "#B8860B", precision: 4 },
  AVAX: { name: "Avalanche", color: "#E84142", precision: 2 },
  LINK: { name: "Chainlink", color: "#2A5ADA", precision: 2 },
  DOT: { name: "Polkadot", color: "#C2185B", precision: 3 },
};

export const symbolMeta = (symbol: string) =>
  SYMBOL_META[symbol] ?? { name: symbol, color: "var(--brand)", precision: 2 };

export const round = (value: number, precision: number) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const change24h = (asset: Pick<Asset, "open" | "price">) =>
  asset.open === 0 ? 0 : ((asset.price - asset.open) / asset.open) * 100;

/* ------------------------------------------------------------ API payloads */

export type ApiTicker = {
  symbol: string;
  price: number;
  change24h: number;
  bid: number;
  ask: number;
  at: number;
  sparkline?: number[];
};

export type ApiDepthLevel = { price: number; quantity: number };
export type ApiDepth = { symbol: string; bids: ApiDepthLevel[]; asks: ApiDepthLevel[]; spread: number };
export type ApiMarket = ApiTicker;

export type ApiEngineOrder = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  kind: "MARKET" | "LIMIT";
  price: number;
  quantity: number;
  filled: number;
  status: "OPEN" | "FILLED" | "CANCELLED";
  createdAt: number;
};

export type ApiWallet = {
  id: string;
  currencyCode: string;
  balance: string | number;
  lockedBalance?: string | number;
};

const finite = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Maps an engine ticker to the presentation asset the components consume. */
export function toAsset(ticker: ApiTicker): Asset | null {
  if (!ticker?.symbol) return null;
  const meta = symbolMeta(ticker.symbol);
  const price = finite(ticker.price);
  const change = finite(ticker.change24h);
  return {
    symbol: ticker.symbol,
    name: meta.name,
    price,
    // The engine reports change against its 24h open; recover the open price so
    // the helper can keep recomputing the percentage as ticks arrive.
    open: change === -100 ? price : price / (1 + change / 100),
    color: meta.color,
    precision: meta.precision,
    sparkline: Array.isArray(ticker.sparkline) ? ticker.sparkline.filter((point) => Number.isFinite(point)) : [],
  };
}

export function toAssets(payload: unknown): Asset[] {
  const markets = (payload as { markets?: unknown })?.markets;
  if (!Array.isArray(markets)) return [];
  return markets
    .map((entry) => toAsset(entry as ApiTicker))
    .filter((entry): entry is Asset => entry !== null)
    .sort((left, right) => left.symbol.localeCompare(right.symbol));
}

/** Wallet rows → available USD plus a per-symbol holding map. */
export function toBalances(payload: unknown): Balances {
  const wallets = (payload as { wallets?: unknown })?.wallets;
  if (!Array.isArray(wallets)) return { usd: 0, assets: {} };
  const assets: Record<string, number> = {};
  let usd = 0;
  for (const entry of wallets as ApiWallet[]) {
    const code = String(entry?.currencyCode ?? "").toUpperCase();
    const available = finite(entry?.balance);
    if (!code) continue;
    if (code === "USD") usd += available;
    else assets[code] = (assets[code] ?? 0) + available;
  }
  return { usd: round(usd, 2), assets };
}

/** Engine orders → rows; only resting orders are rendered. */
export function toOpenOrders(payload: unknown): OpenOrder[] {
  const orders = (payload as { orders?: unknown })?.orders;
  if (!Array.isArray(orders)) return [];
  return (orders as ApiEngineOrder[])
    .filter((order) => order?.status === "OPEN")
    .map((order) => ({
      id: order.id,
      symbol: order.symbol,
      side: (order.side === "BUY" ? "Buy" : "Sell") as Side,
      kind: (order.kind === "MARKET" ? "Market" : "Limit") as OrderKind,
      price: finite(order.price),
      amount: finite(order.quantity),
      filled: finite(order.filled),
      status: order.filled > 0 ? ("Partial" as const) : ("Open" as const),
      placedAt: new Date(finite(order.createdAt, Date.now())).toISOString(),
    }))
    .sort((left, right) => right.placedAt.localeCompare(left.placedAt));
}

/** Depth payload → cumulative levels (the shading and spread row need totals). */
export function toBook(payload: unknown, precision = 2): OrderBook {
  const depth = payload as ApiDepth | null | undefined;
  const side = (levels: ApiDepthLevel[] | undefined) => {
    let total = 0;
    return (Array.isArray(levels) ? levels : []).slice(0, BOOK_DEPTH).map((level) => {
      const size = finite(level.quantity);
      total += size;
      return {
        price: round(finite(level.price), precision),
        size: round(size, 4),
        total: round(total, 4),
      };
    });
  };
  return { bids: side(depth?.bids), asks: side(depth?.asks) };
}

export function toCandles(payload: unknown): Candle[] {
  const candles = (payload as { candles?: unknown })?.candles;
  if (!Array.isArray(candles)) return [];
  return (candles as Candle[])
    .filter((candle) => Number.isFinite(candle?.time) && Number.isFinite(candle?.close))
    .map((candle) => ({
      time: candle.time,
      open: finite(candle.open),
      high: finite(candle.high),
      low: finite(candle.low),
      close: finite(candle.close),
      volume: finite(candle.volume),
    }));
}

/** Extends the newest candle with a live print; history is never reseeded. */
export function applyPriceToCandle(candle: Candle, price: number, precision: number): Candle {
  return {
    ...candle,
    close: round(price, precision),
    high: round(Math.max(candle.high, price), precision),
    low: round(Math.min(candle.low, price), precision),
  };
}

export const spread = (book: OrderBook) => (book.asks[0] && book.bids[0] ? book.asks[0].price - book.bids[0].price : 0);

export const spreadPercent = (book: OrderBook) => {
  const bestAsk = book.asks[0]?.price;
  return bestAsk ? (spread(book) / bestAsk) * 100 : 0;
};

/* ----------------------------------------------------------------- orders */

export type Quote = { gross: number; fee: number; total: number };

/** `total` is what leaves the wallet (buy) or lands in it (sell). */
export function quoteOrder(side: Side, amount: number, price: number, feeRate = FEE_RATE): Quote {
  const gross = amount * price;
  const fee = gross * feeRate;
  return { gross, fee, total: side === "Buy" ? gross + fee : gross - fee };
}

/** Largest size the wallet can cover at `price` for `percent`% of the balance. */
export function maxAmount(
  balances: Balances,
  symbol: string,
  side: Side,
  price: number,
  percent: number,
  feeRate = FEE_RATE,
) {
  const share = Math.min(Math.max(percent, 0), 100) / 100;
  if (price <= 0) return 0;
  if (side === "Buy") return (balances.usd * share) / (price * (1 + feeRate));
  return (balances.assets[symbol] ?? 0) * share;
}

/** Applies a filled order to a local balance snapshot (optimistic display only). */
export function applyOrderToBalances(
  balances: Balances,
  order: { side: Side; symbol: string; amount: number; price: number },
): Balances {
  const { total } = quoteOrder(order.side, order.amount, order.price);
  const held = balances.assets[order.symbol] ?? 0;
  return {
    usd: round(order.side === "Buy" ? balances.usd - total : balances.usd + total, 2),
    assets: {
      ...balances.assets,
      [order.symbol]: round(
        order.side === "Buy" ? held + order.amount : Math.max(held - order.amount, 0),
        8,
      ),
    },
  };
}

export function holdingValue(balances: Balances, asset: Asset) {
  return (balances.assets[asset.symbol] ?? 0) * asset.price;
}

export function equity(balances: Balances, assets: Asset[]) {
  return balances.usd + assets.reduce((sum, asset) => sum + holdingValue(balances, asset), 0);
}

export const engineSide = (side: Side) => (side === "Buy" ? "BUY" : "SELL");
export const engineKind = (kind: OrderKind) => (kind === "Market" ? "MARKET" : "LIMIT");

/* -------------------------------------------------------------- formatting */

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatUsd = (value: number) => usdFormatter.format(value);

export const formatPrice = (value: number, precision: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(Number.isFinite(value) ? value : 0);

export const formatQty = (value: number, precision = 4) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: precision }).format(
    Number.isFinite(value) ? value : 0,
  );

export const formatPercent = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`;

export const formatClock = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toISOString().slice(11, 16)} UTC`;
};
