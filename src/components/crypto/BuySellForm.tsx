"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  FEE_RATE,
  formatPrice,
  formatQty,
  formatUsd,
  maxAmount,
  quoteOrder,
  type Asset,
  type Balances,
  type OrderInput,
  type OrderKind,
  type Side,
} from "@/lib/demo/crypto";

type BuySellFormProps = {
  asset: Asset;
  balance: Balances;
  onSubmit: (input: OrderInput) => void;
};

const PERCENTS = [0, 25, 50, 75, 100];
const amountFor = (total: number, price: number, side: Side) =>
  price > 0 ? total / (price * (side === "Buy" ? 1 + FEE_RATE : 1 - FEE_RATE)) : 0;
const toInput = (value: number, precision = 6) => (value > 0 ? Number(value.toFixed(precision)).toString() : "");

export function BuySellForm({ asset, balance, onSubmit }: BuySellFormProps) {
  const [side, setSide] = React.useState<Side>("Buy");
  const [kind, setKind] = React.useState<OrderKind>("Market");
  const [amountInput, setAmountInput] = React.useState("");
  const [totalInput, setTotalInput] = React.useState("");
  const [limitPrice, setLimitPrice] = React.useState(() => asset.price.toFixed(asset.precision));
  const [percent, setPercent] = React.useState(0);
  const [edited, setEdited] = React.useState<"amount" | "total">("amount");
  const [confirming, setConfirming] = React.useState(false);

  const price = kind === "Market" ? asset.price : Number(limitPrice) || 0;
  // Only the field the user typed into is stored; the other is derived, so a
  // live price tick keeps fee and total correct without an effect.
  const amountValue = edited === "amount" ? Number(amountInput) || 0 : amountFor(Number(totalInput) || 0, price, side);
  const quote = quoteOrder(side, amountValue, price);
  const amountField = edited === "amount" ? amountInput : amountValue > 0 ? toInput(amountValue) : "";
  const totalField = edited === "total" ? totalInput : quote.total > 0 ? quote.total.toFixed(2) : "";
  const held = balance.assets[asset.symbol] ?? 0;

  const writeAmount = (raw: string) => {
    setAmountInput(raw);
    setEdited("amount");
  };

  const writeTotal = (raw: string) => {
    setTotalInput(raw);
    setEdited("total");
  };

  const chooseSide = (next: Side) => {
    setSide(next);
    setAmountInput("");
    setTotalInput("");
    setPercent(0);
    setEdited("amount");
  };

  const applyPercent = (next: number) => {
    setPercent(next);
    const size = maxAmount(balance, asset.symbol, side, price, next);
    setAmountInput(size > 0 ? toInput(size) : "");
    setEdited("amount");
  };

  const insufficient = side === "Buy" ? quote.total > balance.usd + 1e-9 : amountValue > held + 1e-9;
  const error = amountValue > 0 && price > 0 && insufficient ? (side === "Buy" ? "Not enough USD available." : `Not enough ${asset.symbol} available.`) : null;
  const canSubmit = amountValue > 0 && price > 0 && !error;

  const confirm = () => {
    onSubmit({ symbol: asset.symbol, side, kind, amount: amountValue, price });
    setConfirming(false);
    setAmountInput("");
    setTotalInput("");
    setPercent(0);
    setEdited("amount");
  };

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Trade {asset.symbol}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Order side">
          {(["Buy", "Sell"] as Side[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={side === option}
              onClick={() => chooseSide(option)}
              // Inline colours: legacy unlayered `button` rules in globals.css
              // win over Tailwind's layered background utilities.
              style={side === option ? { backgroundColor: option === "Buy" ? "var(--success)" : "var(--danger)", color: "#fff" } : undefined}
              className={cn(
                "h-8 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                side === option ? "shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <Tabs value={kind} onValueChange={(value) => setKind(value as OrderKind)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="Market">Market</TabsTrigger>
            <TabsTrigger value="Limit">Limit</TabsTrigger>
          </TabsList>
        </Tabs>

        {kind === "Limit" ? (
          <div className="space-y-1">
            <label htmlFor="order-limit-price" className="text-xs font-medium text-muted-foreground">
              Limit price
            </label>
            <div className="relative">
              <Input
                id="order-limit-price"
                inputMode="decimal"
                value={limitPrice}
                onChange={(event) => setLimitPrice(event.target.value)}
                className="h-9 pr-12 text-right font-mono tabular-nums"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD</span>
            </div>
            <button
              type="button"
              onClick={() => setLimitPrice(asset.price.toFixed(asset.precision))}
              className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Use market price · {formatPrice(asset.price, asset.precision)}
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Fills at the live price · {formatPrice(asset.price, asset.precision)}
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="order-amount" className="text-xs font-medium text-muted-foreground">
            Amount
          </label>
          <div className="relative">
            <Input
              id="order-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amountField}
              onChange={(event) => writeAmount(event.target.value)}
              className="h-9 pr-16 text-right font-mono tabular-nums"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{asset.symbol}</span>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="order-total" className="text-xs font-medium text-muted-foreground">
            {side === "Buy" ? "Total cost" : "Total received"}
          </label>
          <div className="relative">
            <Input
              id="order-total"
              inputMode="decimal"
              placeholder="0.00"
              value={totalField}
              onChange={(event) => writeTotal(event.target.value)}
              className="h-9 pr-12 text-right font-mono tabular-nums"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <input
            type="range"
            min={0}
            max={100}
            step={25}
            value={percent}
            aria-label="Order size as a percentage of available balance"
            onChange={(event) => applyPercent(Number(event.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-[var(--brand)]"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {PERCENTS.map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => applyPercent(step)}
                className={cn("rounded px-1 tabular-nums hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", percent === step && "font-semibold text-foreground")}
              >
                {step}%
              </button>
            ))}
          </div>
        </div>

        <dl className="space-y-1.5 rounded-lg bg-muted/60 p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Fee ({(FEE_RATE * 100).toFixed(2)}%)</dt>
            <dd className="font-mono tabular-nums">{formatUsd(quote.fee)}</dd>
          </div>
          <div className="flex items-center justify-between font-medium">
            <dt className="text-muted-foreground">{side === "Buy" ? "Total cost" : "You receive"}</dt>
            <dd className="font-mono tabular-nums">{formatUsd(quote.total)}</dd>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <dt className="text-muted-foreground">Available</dt>
            <dd className="font-mono tabular-nums text-muted-foreground">
              {side === "Buy" ? formatUsd(balance.usd) : `${formatQty(held, 8)} ${asset.symbol}`}
            </dd>
          </div>
        </dl>

        {error ? (
          <p role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          size="lg"
          disabled={!canSubmit}
          onClick={() => setConfirming(true)}
          style={{ backgroundColor: side === "Buy" ? "var(--success)" : "var(--danger)", color: "#fff" }}
          className="w-full hover:opacity-90"
        >
          {side} {asset.symbol}
        </Button>

        <Dialog open={confirming} onOpenChange={setConfirming}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Confirm {kind.toLowerCase()} {side.toLowerCase()}
              </DialogTitle>
              <DialogDescription>
                {formatQty(amountValue, 6)} {asset.symbol} at {formatPrice(price, asset.precision)} per {asset.symbol}
              </DialogDescription>
            </DialogHeader>
            <dl className="space-y-2 rounded-lg border border-border p-3 text-sm">
              {[
                ["Side", side],
                ["Order type", kind],
                ["Amount", `${formatQty(amountValue, 6)} ${asset.symbol}`],
                ["Price", formatPrice(price, asset.precision)],
                ["Fee", formatUsd(quote.fee)],
                [side === "Buy" ? "Total cost" : "You receive", formatUsd(quote.total)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-mono tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
                Back
              </Button>
              <Button
                type="button"
                onClick={confirm}
                style={{ backgroundColor: side === "Buy" ? "var(--success)" : "var(--danger)", color: "#fff" }}
                className="hover:opacity-90"
              >
                Confirm {side.toLowerCase()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
