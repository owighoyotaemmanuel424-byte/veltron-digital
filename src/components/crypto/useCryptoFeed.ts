"use client";

import * as React from "react";
import {
  advanceOpenOrders,
  applyOrderToBalances,
  buildCandles,
  buildOrderBook,
  createAssets,
  equity as computeEquity,
  seededRandom,
  seedBalances,
  seedOpenOrders,
  tickAssets,
  updateOrderBook,
  type Asset,
  type Balances,
  type Candle,
  type OpenOrder,
  type OrderBook,
  type OrderInput,
  type Timeframe,
} from "@/lib/demo/crypto";

/** How often the simulated socket pushes a frame. */
export const TICK_MS = 1800;

type Market = { assets: Asset[]; balances: Balances; orders: OpenOrder[] };

const seedFor = (values: (string | number)[]) =>
  values.reduce<number>(
    (hash, value) => (hash * 31 + String(value).split("").reduce<number>((sum, char) => sum + char.charCodeAt(0), 0)) % 100000,
    7,
  );

/**
 * Stand-in for a live market feed: a single interval pushes new prices, order
 * book levels and partial fills. Everything is seeded, so the first paint (and
 * therefore server-rendered HTML) matches the first client render.
 */
export function useCryptoFeed(options: { onOrderFilled?: (order: OpenOrder) => void } = {}) {
  const random = React.useRef(seededRandom(915131));
  const [market, setMarket] = React.useState<Market>(() => {
    const assets = createAssets();
    return { assets, balances: seedBalances(assets), orders: seedOpenOrders(assets) };
  });
  const marketRef = React.useRef(market);
  const [symbol, setSymbol] = React.useState("BTC");
  const [timeframe, setTimeframe] = React.useState<Timeframe>("1H");
  const [book, setBook] = React.useState<OrderBook>(() => {
    const assets = createAssets();
    const btc = assets.find((asset) => asset.symbol === "BTC") ?? assets[0];
    return buildOrderBook(btc.price, seededRandom(4242), btc.precision);
  });
  const bookRef = React.useRef(book);
  const symbolRef = React.useRef(symbol);
  const onFilledRef = React.useRef(options.onOrderFilled);
  React.useEffect(() => {
    onFilledRef.current = options.onOrderFilled;
  }, [options.onOrderFilled]);

  const selected = market.assets.find((asset) => asset.symbol === symbol) ?? market.assets[0];

  // Rebuild the book from scratch when the user picks another market.
  React.useEffect(() => {
    symbolRef.current = symbol;
    const asset = marketRef.current.assets.find((entry) => entry.symbol === symbol) ?? marketRef.current.assets[0];
    const fresh = buildOrderBook(asset.price, seededRandom(4242 + seedFor([symbol])), asset.precision);
    bookRef.current = fresh;
    setBook(fresh);
  }, [symbol]);

  // The simulated socket. Refs keep the loop stable without re-subscribing.
  React.useEffect(() => {
    const id = window.setInterval(() => {
      const current = marketRef.current;
      const assets = tickAssets(current.assets, random.current);
      const { orders, filled } = advanceOpenOrders(current.orders, random.current);
      const next: Market = { ...current, assets, orders };
      marketRef.current = next;
      setMarket(next);

      const live = assets.find((asset) => asset.symbol === symbolRef.current) ?? assets[0];
      const nextBook = updateOrderBook(bookRef.current, live.price, random.current, live.precision);
      bookRef.current = nextBook;
      setBook(nextBook);

      for (const order of filled) onFilledRef.current?.(order);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // History is seeded from the price at selection time (not the 24h open) so the
  // newest candle starts where the live price is; each tick only extends it.
  const candleKey = `${symbol}:${timeframe}`;
  const [candleBase, setCandleBase] = React.useState({ key: candleKey, price: selected.price });
  if (candleBase.key !== candleKey) setCandleBase({ key: candleKey, price: selected.price });

  const candles: Candle[] = React.useMemo(
    () =>
      buildCandles(
        { price: candleBase.price, volatility: selected.volatility, precision: selected.precision },
        timeframe,
        seededRandom(seedFor([symbol, timeframe])),
      ),
    [candleBase, symbol, timeframe, selected.volatility, selected.precision],
  );

  const placeOrder = React.useCallback((input: OrderInput) => {
    const current = marketRef.current;
    const order: OpenOrder = {
      id: `ORD-${4900 + current.orders.length + 1}`,
      symbol: input.symbol,
      side: input.side,
      kind: input.kind,
      price: input.price,
      amount: input.amount,
      filled: 0,
      status: "Open",
      placedAt: new Date().toISOString(),
    };
    const next: Market = { ...current, orders: [order, ...current.orders], balances: applyOrderToBalances(current.balances, input) };
    marketRef.current = next;
    setMarket(next);
    return order;
  }, []);

  const cancelOrder = React.useCallback((id: string) => {
    const current = marketRef.current;
    const next: Market = { ...current, orders: current.orders.filter((order) => order.id !== id) };
    marketRef.current = next;
    setMarket(next);
  }, []);

  return {
    assets: market.assets,
    selected,
    balances: market.balances,
    orders: market.orders,
    book,
    candles,
    symbol,
    setSymbol,
    timeframe,
    setTimeframe,
    placeOrder,
    cancelOrder,
    equity: computeEquity(market.balances, market.assets),
  };
}
