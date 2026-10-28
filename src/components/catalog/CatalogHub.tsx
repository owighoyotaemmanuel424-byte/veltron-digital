"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  LineChart,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  categoryLabels,
  demoWalletBalance,
  money,
  percent,
  type CatalogCategory,
  type CatalogProduct,
} from "@/lib/demo/catalog";

const categoryOrder: CatalogCategory[] = ["GLOBAL_BUSINESS", "CRYPTO_EXCHANGE", "SAVINGS_VAULT", "ANALYTICS_PRO"];

const categoryIcon: Record<CatalogCategory, React.ComponentType<{ className?: string }>> = {
  GLOBAL_BUSINESS: Sparkles,
  CRYPTO_EXCHANGE: TrendingUp,
  SAVINGS_VAULT: Wallet,
  ANALYTICS_PRO: LineChart,
};

type Filter = "ALL" | CatalogCategory;

type CatalogHubProps = { products: CatalogProduct[]; source?: "live" | "demo" };

export function CatalogHub({ products, source = "demo" }: CatalogHubProps) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("ALL");
  const [quickView, setQuickView] = React.useState<CatalogProduct | null>(null);
  const [activation, setActivation] = React.useState<CatalogProduct | null>(null);
  const [tierIndex, setTierIndex] = React.useState(0);
  const [amount, setAmount] = React.useState("");
  const [balance, setBalance] = React.useState(demoWalletBalance);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = filter === "ALL" || product.category === filter;
      const matchesQuery =
        !needle ||
        product.name.toLowerCase().includes(needle) ||
        product.tagline.toLowerCase().includes(needle) ||
        categoryLabels[product.category].toLowerCase().includes(needle) ||
        product.features.some((feature) => feature.toLowerCase().includes(needle));
      return matchesCategory && matchesQuery;
    });
  }, [products, filter, query]);

  const openQuickView = (product: CatalogProduct) => {
    setQuickView(product);
    setTierIndex(0);
  };

  const startActivation = (product: CatalogProduct, tier = 0) => {
    setActivation(product);
    setTierIndex(tier);
    setAmount("");
    setQuickView(null);
  };

  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const fee = activation && validAmount ? numericAmount * activation.tiers[tierIndex].feeRate : 0;
  const total = validAmount ? numericAmount + fee : 0;
  const insufficient = total > balance;

  const confirmActivation = () => {
    if (!activation || !validAmount || insufficient) return;
    setBalance((current) => Number((current - total).toFixed(2)));
    toast.success(`${activation.name} activated`, {
      description: `${money(total)} debited · ${money(balance - total)} available`,
    });
    setActivation(null);
    setAmount("");
  };

  return (
    <div className="space-y-6">
      {source === "demo" ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          The platform API is not reachable, so this catalog is showing bundled demo products and a simulated wallet balance.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search catalog"
            placeholder="Search services, vaults, analytics…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9 pr-9"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
          <Wallet aria-hidden="true" className="size-4 text-brand" />
          <span className="font-medium text-foreground">{money(balance)}</span>
          <span>available</span>
        </div>
      </div>

      <div role="tablist" aria-label="Catalog categories" className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-card p-1.5">
        {(["ALL", ...categoryOrder] as Filter[]).map((entry) => (
          <button
            key={entry}
            type="button"
            role="tab"
            aria-selected={filter === entry}
            onClick={() => setFilter(entry)}
            className={cn(
              "h-8 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filter === entry ? "bg-brand text-brand-fg" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
            )}
          >
            {entry === "ALL" ? "All services" : categoryLabels[entry]}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {visible.length} {visible.length === 1 ? "product" : "products"}
        {query ? ` matching “${query}”` : ""}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium">Nothing matched that search.</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different category or clear the search box.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => { setQuery(""); setFilter("ALL"); }}>
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((product) => {
            const Icon = categoryIcon[product.category];
            return (
              <article key={product.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {product.popular ? <Badge variant="success">Popular</Badge> : <Badge variant="outline">{categoryLabels[product.category]}</Badge>}
                </div>
                <h2 className="mt-4 text-base font-semibold tracking-tight">{product.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{product.tagline}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                  <div>
                    <dt className="text-muted-foreground">{product.apyRate > 0 ? "Target APY" : "Trading fee"}</dt>
                    <dd className="mt-1 font-semibold">
                      {product.apyRate > 0 ? percent(product.apyRate) : percent(product.feeRate * 100)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">From</dt>
                    <dd className="mt-1 font-semibold">
                      {product.tiers[0].priceMonthly === 0 ? "Free" : `${money(product.tiers[0].priceMonthly)}/mo`}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openQuickView(product)}>
                    Quick view
                  </Button>
                  <Button variant="brand" size="sm" className="flex-1" onClick={() => startActivation(product)}>
                    Activate
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={quickView !== null} onOpenChange={(open) => (!open ? setQuickView(null) : undefined)}>
        <DialogContent className="max-w-xl">
          {quickView ? (
            <>
              <DialogHeader>
                <DialogTitle>{quickView.name}</DialogTitle>
                <DialogDescription>{quickView.tagline}</DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-6 text-muted-foreground">{quickView.description}</p>

              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2 text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Tier</th>
                      <th scope="col" className="px-3 py-2 font-medium">Monthly</th>
                      <th scope="col" className="px-3 py-2 font-medium">APY / fee</th>
                      <th scope="col" className="px-3 py-2 font-medium">Limits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quickView.tiers.map((tier) => (
                      <tr key={tier.name} className="border-t border-border">
                        <th scope="row" className="px-3 py-2 font-medium">{tier.name}</th>
                        <td className="px-3 py-2">{tier.priceMonthly === 0 ? "Free" : money(tier.priceMonthly)}</td>
                        <td className="px-3 py-2">{tier.apy !== null ? percent(tier.apy) : percent(tier.feeRate * 100)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{tier.limits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {quickView.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setQuickView(null)}>Close</Button>
                <Button variant="brand" onClick={() => startActivation(quickView)}>Activate service</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={activation !== null} onOpenChange={(open) => (!open ? setActivation(null) : undefined)}>
        <DialogContent className="max-w-md">
          {activation ? (
            <>
              <DialogHeader>
                <DialogTitle>Activate {activation.name}</DialogTitle>
                <DialogDescription>
                  Funds are debited from your available balance through the ledger, and locked until activation completes.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <label htmlFor="activation-tier" className="text-sm font-medium">Tier</label>
                <select
                  id="activation-tier"
                  value={tierIndex}
                  onChange={(event) => setTierIndex(Number(event.target.value))}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {activation.tiers.map((tier, index) => (
                    <option key={tier.name} value={index}>
                      {tier.name} · {tier.priceMonthly === 0 ? "Free" : `${money(tier.priceMonthly)}/mo`} ·{" "}
                      {tier.apy !== null ? `${percent(tier.apy)} APY` : `${percent(tier.feeRate * 100)} fee`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="activation-amount" className="text-sm font-medium">Funding amount (USD)</label>
                <Input
                  id="activation-amount"
                  inputMode="decimal"
                  placeholder="1000.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                />
              </div>

              <dl className="space-y-2 rounded-lg border border-border bg-surface-2 p-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Amount</dt><dd>{money(validAmount ? numericAmount : 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Fee ({percent(activation.tiers[tierIndex].feeRate * 100)})</dt><dd>{money(fee)}</dd></div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold"><dt>Total</dt><dd>{money(total)}</dd></div>
                <div className="flex justify-between text-xs"><dt className="text-muted-foreground">Available</dt><dd>{money(balance)}</dd></div>
              </dl>

              {insufficient ? (
                <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                  Insufficient balance. Lower the amount or top up your wallet first.
                </p>
              ) : (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-success" aria-hidden="true" />
                  Settlement posts a balanced debit and credit to the ledger.
                </p>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setActivation(null)}>Cancel</Button>
                <Button variant="brand" disabled={!validAmount || insufficient} onClick={confirmActivation}>
                  Confirm activation
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
