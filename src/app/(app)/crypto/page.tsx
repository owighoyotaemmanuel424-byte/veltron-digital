"use client";

import * as React from "react";
import { toast } from "sonner";

import { BuySellForm } from "@/components/crypto/BuySellForm";
import { OpenOrders } from "@/components/crypto/OpenOrders";
import { OrderBook } from "@/components/crypto/OrderBook";
import { TradeChart } from "@/components/crypto/TradeChart";
import { WalletStrip } from "@/components/crypto/WalletStrip";
import { Watchlist } from "@/components/crypto/Watchlist";
import { useCryptoFeed } from "@/components/crypto/useCryptoFeed";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatPrice, formatQty, type OpenOrder, type OrderInput } from "@/lib/demo/crypto";

const priceOf = (order: OpenOrder) => formatPrice(order.price, order.price < 1 ? 4 : 2);

export default function CryptoPage() {
  const feed = useCryptoFeed({
    onOrderFilled: (order) =>
      toast.success(`${order.symbol} order filled`, {
        description: `${order.side} ${formatQty(order.amount, 6)} ${order.symbol} at ${priceOf(order)}`,
      }),
  });
  const [favorites, setFavorites] = React.useState<string[]>(["BTC", "ETH"]);
  const [query, setQuery] = React.useState("");

  const toggleFavorite = (symbol: string) =>
    setFavorites((current) => (current.includes(symbol) ? current.filter((entry) => entry !== symbol) : [...current, symbol]));

  const handleSubmit = (input: OrderInput) => {
    const order = feed.placeOrder(input);
    toast.success(`${input.side} order placed`, {
      description: `${formatQty(order.amount, 6)} ${order.symbol} at ${priceOf(order)} · ${order.kind.toLowerCase()}`,
    });
  };

  const handleCancel = (order: OpenOrder) => {
    feed.cancelOrder(order.id);
    toast.success("Order cancelled", {
      description: `${order.symbol} ${order.side.toLowerCase()} ${formatQty(order.amount, 6)} at ${priceOf(order)}`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crypto"
        description="Live demo market for digital assets: streaming prices, a depth-of-book view, and order entry. Prices are simulated and no real funds move."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-success/70 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            Live demo feed
          </span>
        }
      />

      <WalletStrip assets={feed.assets} balances={feed.balances} equity={feed.equity} />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,340px)] lg:items-start">
        <div className="min-w-0 lg:col-start-2 lg:row-start-1">
          <TradeChart asset={feed.selected} candles={feed.candles} timeframe={feed.timeframe} onTimeframeChange={feed.setTimeframe} />
        </div>

        <div className="min-w-0 lg:col-start-3 lg:row-start-1">
          <BuySellForm asset={feed.selected} balance={feed.balances} onSubmit={handleSubmit} />
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

      <OpenOrders orders={feed.orders} onCancel={handleCancel} />
    </div>
  );
}
