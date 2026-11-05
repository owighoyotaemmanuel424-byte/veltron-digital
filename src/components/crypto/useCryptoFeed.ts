"use client";

import * as React from "react";

import {
  applyPriceToCandle,
  equity as computeEquity,
  symbolMeta,
  toAsset,
  toBook,
  type ApiDepth,
  type ApiTicker,
  type Asset,
  type Balances,
  type Candle,
  type OpenOrder,
  type OrderBook,
  type OrderInput,
  type Timeframe,
} from "@/lib/crypto/market";
import {
  cancelOrder as cancelOrderRequest,
  fetchCandles,
  fetchMarkets,
  fetchOpenOrders,
  fetchWallets,
  placeOrder as placeOrderRequest,
  type FailureKind,
  type PlacedOrder,
} from "@/lib/api/trading";

/** Where the streaming feed lives. Public market data, so no credentials. */
export function marketSocketUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_PLATFORM_API_URL;
  if (!base) return null;
  try {
    const url = new URL(base);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}

export type FeedStatus = "loading" | "ready" | "unavailable";
export type FeedConnection = "connecting" | "live" | "reconnecting" | "offline";

export type TradeResult = { ok: true; order: PlacedOrder } | { ok: false; message: string; kind: FailureKind };

type Frame = {
  type?: string;
  payload?: ApiTicker | ApiTicker[] | ApiDepth | { tickers?: ApiTicker[]; book?: ApiDepth } | { orderId?: string; symbol?: string; price?: number; quantity?: number };
};

const EMPTY_ASSET: Asset = {
  symbol: "—",
  name: "Market feed",
  price: 0,
  open: 0,
  color: "var(--brand)",
  precision: 2,
  sparkline: [],
};

const ORDER_REFRESH_MS = 15_000;

/**
 * Live crypto workspace, driven entirely by `services/platform`.
 *
 * Bootstrap: one REST snapshot for the market list, then wallets and resting
 * orders over the authenticated proxy. Streaming: `/ws` with a `subscribe`
 * frame; `snapshot`, `ticker`, `book` and `fill` frames update state in place.
 * The socket reconnects with jittered exponential backoff (1s → 30s) and
 * resubscribes on open, and a `snapshot` frame restores book state afterwards.
 *
 * Orders are optimistic: a limit order appears immediately, is reconciled with
 * the engine's response, and is restored if the platform rejects it.
 */
export function useCryptoFeed(options: { onFill?: (fill: { symbol?: string; price?: number; quantity?: number }) => void } = {}) {
  const [status, setStatus] = React.useState<FeedStatus>("loading");
  const [error, setError] = React.useState<string | null>(null);
  const [connection, setConnection] = React.useState<FeedConnection>("connecting");
  const [authenticated, setAuthenticated] = React.useState<boolean | null>(null);
  const [authMessage, setAuthMessage] = React.useState<string | null>(null);

  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [balances, setBalances] = React.useState<Balances>({ usd: 0, assets: {} });
  const [orders, setOrders] = React.useState<OpenOrder[]>([]);
  const [book, setBook] = React.useState<OrderBook>({ bids: [], asks: [] });
  const [candles, setCandles] = React.useState<Candle[]>([]);
  const [symbol, setSymbol] = React.useState("BTC");
  const [timeframe, setTimeframe] = React.useState<Timeframe>("1H");

  const symbolRef = React.useRef(symbol);
  const socketRef = React.useRef<WebSocket | null>(null);
  const onFillRef = React.useRef(options.onFill);
  React.useEffect(() => {
    onFillRef.current = options.onFill;
  }, [options.onFill]);

  symbolRef.current = symbol;
  const selected = assets.find((asset) => asset.symbol === symbol) ?? assets[0] ?? EMPTY_ASSET;

  /** Re-reads wallets and resting orders; safe to call after any mutation. */
  const refreshAccount = React.useCallback(async () => {
    const [wallets, open] = await Promise.all([fetchWallets(), fetchOpenOrders()]);
    if (wallets.status === "ok") {
      setBalances(wallets.value);
      setAuthenticated(true);
      setAuthMessage(null);
    } else {
      setAuthenticated(false);
      setAuthMessage(wallets.message);
    }
    if (open.status === "ok") setOrders(open.value);
  }, []);

  /** Initial snapshot. Market data is public; account data degrades separately. */
  const bootstrap = React.useCallback(async () => {
    setStatus("loading");
    setError(null);
    const markets = await fetchMarkets();
    if (markets.status === "error") {
      setStatus("unavailable");
      setError(markets.message);
      return;
    }
    setAssets(markets.value);
    if (!markets.value.some((asset) => asset.symbol === symbolRef.current)) {
      setSymbol(markets.value[0].symbol);
    }
    setStatus("ready");
    await refreshAccount();
  }, [refreshAccount]);

  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  /** Applies one ticker to the watchlist, the selected market and its candle. */
  const applyTicker = React.useCallback((ticker: ApiTicker) => {
    setAssets((current) =>
      current.map((asset) => {
        if (asset.symbol !== ticker.symbol) return asset;
        const sparkline = [...asset.sparkline, ticker.price].slice(-24);
        return toAsset({ ...ticker, sparkline }) ?? asset;
      }),
    );

    if (ticker.symbol !== symbolRef.current) return;
    const precision = symbolMeta(ticker.symbol).precision;
    setCandles((current) => {
      const last = current[current.length - 1];
      if (!last) return current;
      return [...current.slice(0, -1), applyPriceToCandle(last, ticker.price, precision)];
    });
  }, []);

  const handleFrame = React.useCallback(
    (raw: string) => {
      let frame: Frame;
      try {
        frame = JSON.parse(raw) as Frame;
      } catch {
        return;
      }

      if (frame.type === "snapshot") {
        const payload = frame.payload as { tickers?: ApiTicker[]; book?: ApiDepth };
        if (Array.isArray(payload?.tickers)) {
          setAssets((current) =>
            current.map((asset) => {
              const ticker = payload.tickers?.find((entry) => entry.symbol === asset.symbol);
              return ticker ? (toAsset(ticker) ?? asset) : asset;
            }),
          );
        }
        if (payload?.book) {
          setBook(toBook(payload.book, symbolMeta(payload.book.symbol ?? symbolRef.current).precision));
        }
        return;
      }

      if (frame.type === "ticker") {
        const ticker = frame.payload as ApiTicker;
        if (ticker?.symbol) applyTicker(ticker);
        return;
      }

      if (frame.type === "book") {
        const depth = frame.payload as ApiDepth;
        if (depth?.symbol === symbolRef.current) {
          setBook(toBook(depth, symbolMeta(depth.symbol).precision));
        }
        return;
      }

      if (frame.type === "fill") {
        onFillRef.current?.(frame.payload as { symbol?: string; price?: number; quantity?: number });
        void refreshAccount();
      }
    },
    [applyTicker, refreshAccount],
  );

  /** Streaming socket with jittered exponential backoff and resubscribe. */
  React.useEffect(() => {
    if (status !== "ready") return;
    const url = marketSocketUrl();
    if (!url) {
      setConnection("offline");
      return;
    }

    let closed = false;
    let attempt = 0;
    let timer: number | undefined;

    const schedule = () => {
      if (closed) return;
      setConnection("reconnecting");
      attempt += 1;
      const backoff = Math.min(30_000, 1000 * 2 ** (attempt - 1));
      timer = window.setTimeout(connect, backoff * (0.5 + Math.random() * 0.5));
    };

    const connect = () => {
      if (closed) return;
      setConnection(attempt === 0 ? "connecting" : "reconnecting");
      let socket: WebSocket;
      try {
        socket = new WebSocket(url);
      } catch {
        schedule();
        return;
      }
      socketRef.current = socket;

      socket.onopen = () => {
        attempt = 0;
        setConnection("live");
        socket.send(JSON.stringify({ type: "subscribe", symbols: [symbolRef.current] }));
      };
      socket.onmessage = (event) => {
        if (typeof event.data === "string") handleFrame(event.data);
      };
      socket.onerror = () => socket.close();
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        schedule();
      };
    };

    connect();

    return () => {
      closed = true;
      if (timer) window.clearTimeout(timer);
      const socket = socketRef.current;
      socketRef.current = null;
      socket?.close();
    };
  }, [status, handleFrame]);

  /** Move the subscription when the user picks another market. */
  React.useEffect(() => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "subscribe", symbols: [symbol] }));
    }
  }, [symbol]);

  /** OHLC history for the selected symbol and timeframe. */
  React.useEffect(() => {
    if (status !== "ready") return;
    let cancelled = false;
    setCandles([]);
    void fetchCandles(symbol, timeframe).then((result) => {
      if (cancelled) return;
      if (result.status === "ok") setCandles(result.value);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [status, symbol, timeframe]);

  /** Resting orders change through fills, so poll slowly and on focus. */
  React.useEffect(() => {
    if (authenticated !== true) return;
    const refresh = () => void refreshAccount();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, ORDER_REFRESH_MS);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [authenticated, refreshAccount]);

  const placeOrder = React.useCallback(
    async (input: OrderInput): Promise<TradeResult> => {
      const optimisticId = `pending-${Date.now()}`;
      const optimistic: OpenOrder = {
        id: optimisticId,
        symbol: input.symbol,
        side: input.side,
        kind: input.kind,
        price: input.price,
        amount: input.amount,
        filled: 0,
        status: "Open",
        placedAt: new Date().toISOString(),
      };
      // Market orders fill at the engine, so only limit orders rest on screen.
      if (input.kind === "Limit") setOrders((current) => [optimistic, ...current]);

      const result = await placeOrderRequest(input);

      if (result.status === "error") {
        setOrders((current) => current.filter((order) => order.id !== optimisticId));
        if (result.kind === "signed_out") setAuthenticated(false);
        return { ok: false, message: result.message, kind: result.kind };
      }

      const placed = result.value;
      setOrders((current) => {
        const without = current.filter((order) => order.id !== optimisticId);
        if (placed.status === "FILLED") return without;
        return [
          {
            ...optimistic,
            id: placed.id,
            filled: placed.filled,
            status: placed.filled > 0 ? "Partial" : "Open",
          },
          ...without,
        ];
      });

      void refreshAccount();
      return { ok: true, order: placed };
    },
    [refreshAccount],
  );

  const cancelOrder = React.useCallback(
    async (order: OpenOrder): Promise<{ ok: true } | { ok: false; message: string }> => {
      // Optimistic removal; restored if the platform refuses.
      setOrders((current) => current.filter((entry) => entry.id !== order.id));
      const result = await cancelOrderRequest(order.id);
      if (result.status === "error") {
        setOrders((current) => [order, ...current.filter((entry) => entry.id !== order.id)]);
        return { ok: false, message: result.message };
      }
      void refreshAccount();
      return { ok: true };
    },
    [refreshAccount],
  );

  return {
    assets,
    selected,
    balances,
    orders,
    book,
    candles,
    symbol,
    setSymbol,
    timeframe,
    setTimeframe,
    placeOrder,
    cancelOrder,
    equity: computeEquity(balances, assets),
    status,
    error,
    connection,
    authenticated,
    authMessage,
    retry: () => void bootstrap(),
  };
}
