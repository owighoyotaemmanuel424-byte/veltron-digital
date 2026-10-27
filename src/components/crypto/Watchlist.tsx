"use client";

import * as React from "react";
import { Search, Star } from "lucide-react";

import { PriceTicker } from "@/components/shared/PriceTicker";
import { Sparkline } from "@/components/shared/Sparkline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { change24h, formatPercent, type Asset } from "@/lib/demo/crypto";

type WatchlistProps = {
  assets: Asset[];
  selected: string;
  favorites: string[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
};

export function Watchlist({ assets, selected, favorites, query, onQueryChange, onSelect, onToggleFavorite }: WatchlistProps) {
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const needle = query.trim().toLowerCase();
  const visible = assets.filter((asset) => {
    if (favoritesOnly && !favorites.includes(asset.symbol)) return false;
    if (!needle) return true;
    return asset.symbol.toLowerCase().includes(needle) || asset.name.toLowerCase().includes(needle);
  });

  return (
    <Card className="min-w-0">
      <CardHeader className="gap-3 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Watchlist</CardTitle>
          <button
            type="button"
            aria-pressed={favoritesOnly}
            onClick={() => setFavoritesOnly((current) => !current)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              favoritesOnly ? "border-warning/40 bg-warning/10 text-warning" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <Star aria-hidden="true" className={cn("size-3", favoritesOnly && "fill-warning")} />
            Favourites
          </button>
        </div>
        <label className="relative block">
          <span className="sr-only">Search assets</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search assets"
            placeholder="Search symbol or name"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </label>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <div className="max-h-[390px] overflow-y-auto lg:max-h-[560px]">
          {visible.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">No assets match “{query}”.</p>
          ) : (
            <ul aria-label="Watchlist" className="divide-y divide-border/60">
              {visible.map((asset) => {
                const isSelected = asset.symbol === selected;
                const isFavorite = favorites.includes(asset.symbol);
                const change = change24h(asset);
                const up = change >= 0;
                return (
                  <li key={asset.symbol} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSelect(asset.symbol)}
                      aria-current={isSelected ? "true" : undefined}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-2 py-2 pl-3 pr-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        isSelected ? "bg-accent" : "hover:bg-accent/60",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">{asset.symbol}</span>
                        <span className="block truncate text-[10px] text-muted-foreground">{asset.name}</span>
                      </span>
                      <span className="hidden w-10 shrink-0 sm:block">
                        <Sparkline data={asset.sparkline} positive={up} height={22} strokeWidth={1.5} />
                      </span>
                      <span className="shrink-0 text-right">
                        <PriceTicker value={asset.price} precision={asset.precision} className="text-[11px] font-medium" />
                        <span className={cn("block text-[10px] tabular-nums", up ? "text-success" : "text-danger")}>{formatPercent(change)}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(asset.symbol)}
                      aria-pressed={isFavorite}
                      aria-label={isFavorite ? `Remove ${asset.symbol} from favourites` : `Add ${asset.symbol} to favourites`}
                      className="mr-1.5 rounded p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Star aria-hidden="true" className={cn("size-3.5", isFavorite ? "fill-warning text-warning" : "text-muted-foreground")} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
