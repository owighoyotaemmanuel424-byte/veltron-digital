"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, LogIn, RefreshCw } from "lucide-react";

import { BuySellForm } from "@/components/crypto/BuySellForm";
import { OpenOrders } from "@/components/crypto/OpenOrders";
import { OrderBook } from "@/components/crypto/OrderBook";
import { TradeChart } from "@/components/crypto/TradeChart";
import { WalletStrip } from "@/components/crypto/WalletStrip";
import { Watchlist } from "@/components/crypto/Watchlist";
import { useCryptoFeed, type FeedConnection } from "@/components/crypto/useCryptoFeed";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatQty, type OpenOrder, type OrderInput } from "@/lib/crypto/market";
import { cn } from "@/lib/utils";

const priceOf = (order: OpenOrder) => formatPrice(order.price, order.price < 1 ? 4 : 2);

const CONNECTION_COPY: Record<FeedConnection, { label: string; tone: string; dot: string }> = {
  live: { label: "Engine feed live", tone: "text-success", dot: "bg-success" },
  connecting: { label: "Connecting to engine", tone: "text-muted-foreground", dot: "bg-muted-foreground" },
  reconnecting: { label: "Reconnecting", tone: "text-warning", dot: "bg-warning" },
  offline: { label: "Feed offline", tone: "text-danger", dot: "bg-danger" },
};

export default function CryptoPage() {
  const feed = useCryptoFeed({
    onFill: (fill) =>
      toast.success(`${fill.symbol ?? "Order"} filled`, {
        description: `${formatQty(fill.quantity ?? 0, 6)} ${fill.symbol ?? ""} at ${formatPrice(fill.price ?? 0, 2)}`,
      }),
  });
  const [favorites, setFavorites] = React.useState<string[]>(["BTC", "ETH"]);
  const [query, setQuery] = React.useState("");

  const toggleFavorite = (symbol: string) =>
    setFavorites((current) =>
      current.includes(symbol) ? current.filter((entry) => entry !== symbol) : [...current, symbol],
    );

  const handleSubmit = async (input: OrderInput) => {
    const result = await feed.placeOrder(input);
    if (!result.ok) {
      toast.error("Order not placed", { description: result.message });
      return;
    }
    const filled = result.order.status === "FILLED";
    toast.success(filled ? `${input.side} order filled` : `${input.side} order placed`, {
      description: `${formatQty(result.order.quantity, 6)} ${input.symbol} at ${formatPrice(result.order.price, 2)} · ${input.kind.toLowerCase()}`,
    });
  };

  const handleCancel = async (order: OpenOrder) => {
    const result = await feed.cancelOrder(order);
    if (!result.ok) {
      toast.error("Order not cancelled", { description: result.message });
      return;
    }
    toast.success("Order cancelled", {
      description: `${order.symbol} ${order.side.toLowerCase()} ${formatQty(order.amount, 6)} at ${priceOf(order)}`,
    });
  };

  const connection = CONNECTION_COPY[feed.connection];

  const header = (
    <PageHeader
      title="Crypto"
      description="Prices, depth and order entry stream from the platform matching engine. Engine liquidity is simulated; no external exchange or real funds are involved."
      actions={
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium",
            connection.tone,
          )}
        >
          <span aria-hidden="true" className={cn("size-2 rounded-full", connection.dot)} />
          {connection.label}
        </span>
      }
    />
  );

  if (feed.status === "loading") {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,340px)]" aria-busy="true">
          {[0, 1, 2].map((column) => (
            <Card key={column} className="min-w-0">
              <CardContent className="space-y-3 p-4">
                <span className="block h-4 w-24 animate-pulse rounded bg-muted" />
                <span className="block h-40 animate-pulse rounded bg-muted/60" />
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="sr-only">Loading the platform market feed</p>
      </div>
    );
  }

  if (feed.status === "unavailable") {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <span className="flex items-center gap-2 text-sm font-semibold text-danger">
              <AlertTriangle aria-hidden="true" className="size-4" />
              Market feed unavailable
            </span>
            <p className="max-w-prose text-sm text-muted-foreground">
              {feed.error ?? "The platform API did not respond."} Point{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">PLATFORM_API_URL</code> and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">NEXT_PUBLIC_PLATFORM_API_URL</code> at a
              running engine, then retry.
            </p>
            <Button type="button" variant="outline" onClick={feed.retry}>
              <RefreshCw aria-hidden="true" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {feed.authenticated ? (
        <WalletStrip assets={feed.assets} balances={feed.balances} equity={feed.equity} />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Sign in to trade</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {feed.authMessage ?? "Prices and depth are public; balances, orders and order entry need a platform account."}
              </p>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/login">
                <LogIn aria-hidden="true" />
                Sign in
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,340px)] lg:items-start">
        <div className="min-w-0 lg:col-start-2 lg:row-start-1">
          <TradeChart
            asset={feed.selected}
            candles={feed.candles}
            timeframe={feed.timeframe}
            onTimeframeChange={feed.setTimeframe}
          />
        </div>

        <div className="min-w-0 lg:col-start-3 lg:row-start-1">
          {feed.authenticated ? (
            <BuySellForm asset={feed.selected} balance={feed.balances} onSubmit={handleSubmit} />
          ) : (
            <Card className="min-w-0">
              <CardContent className="p-4">
                <p className="text-sm font-semibold">Order entry</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sign in to place a market or limit order. The engine locks the quote balance before accepting it.
                </p>
                <Button asChild className="mt-3 w-full" variant="outline">
                  <Link href="/login">Sign in to trade</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <Watchlist
            assets={feed.assets}
            selected={feed.symbol}
            favorites={favorites}
            query={query}
            onQueryChange={setQuery}
            onSelect={feed.setSymbol}
            onToggleFavorite={toggleFavorite}
          />
        </div>

        <div className="min-w-0 lg:col-start-2 lg:row-start-2">
          <OrderBook levels={feed.book} symbol={feed.symbol} precision={feed.selected.precision} />
        </div>
      </div>

      {feed.authenticated ? (
        <OpenOrders orders={feed.orders} onCancel={handleCancel} />
      ) : null}
    </div>
  );
}
