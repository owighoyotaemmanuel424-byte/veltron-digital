"use client";

import * as React from "react";
import { motion } from "motion/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPrice, formatQty, spread, spreadPercent, type BookLevel } from "@/lib/demo/crypto";

type OrderBookProps = { levels: { bids: BookLevel[]; asks: BookLevel[] }; symbol: string; precision: number };

function BookSide({
  label,
  levels,
  precision,
  tone,
  align,
}: {
  label: string;
  levels: BookLevel[];
  precision: number;
  tone: "bid" | "ask";
  align: "left" | "right";
}) {
  const deepest = levels[levels.length - 1]?.total || 1;
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span>Amount</span>
      </div>
      <ul aria-label={`${label} price levels`} className="space-y-px">
        {levels.map((level) => {
          const width = Math.min(100, (level.total / deepest) * 100);
          return (
            <li key={level.price} className="relative flex items-center justify-between gap-2 overflow-hidden rounded-sm px-2 py-0.5 text-[11px]">
              <motion.span
                aria-hidden="true"
                className={cn(
                  "absolute inset-y-0 w-0",
                  align === "left" ? "left-0 rounded-r-sm" : "right-0 rounded-l-sm",
                  tone === "bid" ? "bg-success/15" : "bg-danger/15",
                )}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
              <span className={cn("relative font-mono tabular-nums", tone === "bid" ? "text-success" : "text-danger")}>
                {formatPrice(level.price, precision)}
              </span>
              <span className="relative font-mono tabular-nums text-muted-foreground">{formatQty(level.size, 4)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function OrderBook({ levels, symbol, precision }: OrderBookProps) {
  const gap = spread(levels);
  const gapPercent = spreadPercent(levels);
  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Order book</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {symbol}/USD · {levels.bids.length} levels per side
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
          Streaming
        </span>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <BookSide label="Bids" levels={levels.bids} precision={precision} tone="bid" align="left" />
          <BookSide label="Asks" levels={levels.asks} precision={precision} tone="ask" align="right" />
        </div>
        <div className="flex items-center justify-between rounded-md bg-muted px-2 py-1.5 text-xs">
          <span className="text-muted-foreground">Spread</span>
          <span className="font-mono tabular-nums">
            {formatPrice(gap, precision)}
            <span className="ml-1 text-muted-foreground">({gapPercent.toFixed(3)}%)</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
