"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatQty, formatUsd, holdingValue, type Asset, type Balances } from "@/lib/demo/crypto";

type WalletStripProps = { assets: Asset[]; balances: Balances; equity: number };

export function WalletStrip({ assets, balances, equity }: WalletStripProps) {
  const holdings = assets.filter((asset) => (balances.assets[asset.symbol] ?? 0) > 0);
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total equity</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{formatUsd(equity)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cash {formatUsd(balances.usd)} · {holdings.length} assets · demo wallet
          </p>
        </div>
        <ul className="flex gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:justify-end xl:overflow-visible xl:pb-0">
          {holdings.map((asset) => (
            <li key={asset.symbol} className="shrink-0 rounded-lg border border-border bg-surface-2/60 px-2.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: asset.color }} />
                <span className="text-[11px] font-semibold">{asset.symbol}</span>
              </div>
              <p className={cn("mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground")}>
                {formatQty(balances.assets[asset.symbol] ?? 0, 6)}
              </p>
              <p className="font-mono text-[11px] tabular-nums">{formatUsd(holdingValue(balances, asset))}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
