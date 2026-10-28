"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Check, LineChart, Search, Sparkles, TrendingUp, Wallet, X } from "lucide-react";

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
import { createVaultAction, type VaultActionState } from "@/app/(app)/savings/actions";
import { categoryLabels, money, percent, type CatalogCategory, type CatalogProduct } from "@/lib/marketplace/catalog";
import { cn } from "@/lib/utils";

const categoryOrder: CatalogCategory[] = ["GLOBAL_BUSINESS", "CRYPTO_EXCHANGE", "SAVINGS_VAULT", "ANALYTICS_PRO"];

const categoryIcon: Record<CatalogCategory, React.ComponentType<{ className?: string }>> = {
  GLOBAL_BUSINESS: Sparkles,
  CRYPTO_EXCHANGE: TrendingUp,
  SAVINGS_VAULT: Wallet,
  ANALYTICS_PRO: LineChart,
};

/** Colour-coded icon badges give each category a scannable identity. */
const categoryTone: Record<CatalogCategory, string> = {
  GLOBAL_BUSINESS: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  CRYPTO_EXCHANGE: "border-sky-500/25 bg-sky-500/10 text-sky-400",
  SAVINGS_VAULT: "border-violet-500/25 bg-violet-500/10 text-violet-400",
  ANALYTICS_PRO: "border-amber-500/25 bg-amber-500/10 text-amber-400",
};

type Filter = "ALL" | CatalogCategory;

export function CatalogHub({ products, signedIn }: { products: CatalogProduct[]; signedIn: boolean }) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("ALL");
  const [quickView, setQuickView] = React.useState<CatalogProduct | null>(null);
  const [activation, setActivation] = React.useState<CatalogProduct | null>(null);
  const [state, formAction, pending] = useActionState<VaultActionState, FormData>(createVaultAction, null);

  React.useEffect(() => {
    if (state?.ok) setActivation(null);
  }, [state]);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = filter === "ALL" || product.category === filter;
      const matchesQuery =
        !needle ||
        product.name.toLowerCase().includes(needle) ||
        product.tagline.toLowerCase().includes(needle) ||
        categoryLabels[product.category].toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [products, filter, query]);

  const startActivation = (product: CatalogProduct) => {
    setActivation(product);
    setQuickView(null);
  };

  return (
    <div className="space-y-5">
      {/* Sticky control bar: thumb-reachable on phones, inline on desktop. */}
      <div className="sticky top-0 z-20 -mx-4 space-y-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-xl sm:border sm:border-border sm:bg-card sm:p-3">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search catalog"
            placeholder="Search services, vaults, analytics…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 pl-9 pr-11"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-0 top-0 grid size-11 place-items-center text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div role="tablist" aria-label="Catalog categories" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["ALL", ...categoryOrder] as Filter[]).map((entry) => (
            <button
              key={entry}
              type="button"
              role="tab"
              aria-selected={filter === entry}
              onClick={() => setFilter(entry)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filter === entry ? "bg-brand text-brand-fg" : "border border-border bg-surface-2 text-muted-foreground",
              )}
            >
              {entry === "ALL" ? "All services" : categoryLabels[entry]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {visible.length} {visible.length === 1 ? "product" : "products"}
        {query ? ` matching “${query}”` : ""}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm font-medium">{products.length ? "Nothing matched that search." : "No active products yet."}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {products.length ? "Try another category or clear the search box." : "An administrator has not published any products in this category."}
          </p>
          {products.length ? (
            <Button variant="outline" size="sm" className="mt-4 h-10" onClick={() => { setQuery(""); setFilter("ALL"); }}>
              Reset filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((product) => {
            const Icon = categoryIcon[product.category];
            return (
              <article key={product.id} className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-border/80">
                <div className="flex items-start justify-between gap-3">
                  <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl border", categoryTone[product.category])}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <Badge variant="outline">{categoryLabels[product.category]}</Badge>
                </div>
                <h2 className="mt-4 text-base font-semibold tracking-tight">{product.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.tagline}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                  <div>
                    <dt className="text-muted-foreground">{product.apyRate > 0 ? "Target APY" : "Fee"}</dt>
                    <dd className="mt-1 text-base font-semibold tabular-nums">{product.apyRate > 0 ? percent(product.apyRate) : percent(product.feeRate * 100)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Monthly</dt>
                    <dd className="mt-1 text-base font-semibold tabular-nums">{product.tiers[0]?.priceMonthly ? money(product.tiers[0].priceMonthly) : "Free"}</dd>
                  </div>
                </dl>
                {/* Full-width, 44px targets on touch. */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-11 w-full" onClick={() => setQuickView(product)}>Details</Button>
                  <Button variant="brand" className="h-11 w-full" onClick={() => startActivation(product)}>
                    Activate<ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={quickView !== null} onOpenChange={(open) => (!open ? setQuickView(null) : undefined)}>
        <DialogContent className="max-h-[88dvh] max-w-xl overflow-y-auto">
          {quickView ? (
            <>
              <DialogHeader>
                <DialogTitle>{quickView.name}</DialogTitle>
                <DialogDescription>{quickView.tagline}</DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-6 text-muted-foreground">{quickView.description}</p>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[420px] text-left text-xs">
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
                    <Check className="size-4 shrink-0 text-success" aria-hidden="true" />{feature}
                  </li>
                ))}
              </ul>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={() => setQuickView(null)}>Close</Button>
                <Button variant="brand" className="h-11 w-full sm:w-auto" onClick={() => startActivation(quickView)}>Activate</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={activation !== null} onOpenChange={(open) => (!open ? setActivation(null) : undefined)}>
        <DialogContent className="max-h-[88dvh] max-w-md overflow-y-auto">
          {activation ? (
            <>
              <DialogHeader>
                <DialogTitle>Activate {activation.name}</DialogTitle>
                <DialogDescription>
                  {activation.category === "SAVINGS_VAULT"
                    ? "Opens a vault through the platform API. Nothing is created until the request succeeds."
                    : "This product is provisioned by the operations desk, so it cannot be self-activated yet."}
                </DialogDescription>
              </DialogHeader>

              {activation.category === "SAVINGS_VAULT" ? (
                !signedIn ? (
                  <div className="space-y-4">
                    <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                      Sign in to open a vault against your own account.
                    </p>
                    <Button asChild variant="brand" className="h-11 w-full">
                      <Link href="/login">Sign in</Link>
                    </Button>
                  </div>
                ) : (
                  <form action={formAction} className="space-y-4">
                    <input type="hidden" name="productId" value={activation.id} />
                    <input type="hidden" name="name" value={activation.name} />
                    <input type="hidden" name="apyRate" value={activation.apyRate.toFixed(2)} />
                    <input type="hidden" name="schedule" value="MONTHLY" />

                    <div className="space-y-1.5">
                      <label htmlFor="targetAmount" className="text-sm font-medium">Goal (USD, optional)</label>
                      <Input id="targetAmount" name="targetAmount" inputMode="decimal" placeholder="5000.00" className="h-11" />
                    </div>

                    <dl className="space-y-2 rounded-lg border border-border bg-surface-2 p-3 text-sm">
                      <div className="flex justify-between"><dt className="text-muted-foreground">APY</dt><dd>{percent(activation.apyRate)}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Schedule</dt><dd>Monthly</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Fee</dt><dd>{percent(activation.feeRate * 100)}</dd></div>
                    </dl>

                    {state?.error ? (
                      <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">{state.error}</p>
                    ) : null}

                    <DialogFooter className="gap-2 sm:gap-2">
                      <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={() => setActivation(null)}>Cancel</Button>
                      <Button type="submit" variant="brand" className="h-11 w-full sm:w-auto" disabled={pending}>
                        {pending ? "Opening…" : "Open vault"}
                      </Button>
                    </DialogFooter>
                  </form>
                )
              ) : (
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={() => setActivation(null)}>Close</Button>
                  <Button variant="brand" className="h-11 w-full sm:w-auto" disabled>Not self-serve</Button>
                </DialogFooter>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
