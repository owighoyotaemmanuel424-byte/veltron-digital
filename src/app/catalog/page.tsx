import type { Metadata } from "next";

import { CatalogHub } from "@/components/catalog/CatalogHub";
import { PageHeader } from "@/components/shared/PageHeader";
import { fetchPlatformCatalog } from "@/lib/api/platform";

export const metadata: Metadata = {
  title: "Catalog — Veltron",
  description: "Browse Global Business, Crypto Exchange, Yield Vault and Pro Analytics products.",
};

export default async function CatalogPage() {
  const { products, source } = await fetchPlatformCatalog();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Service catalog"
        description="Business formation, exchange execution, yield vaults and analytics — one catalog, one balance, one ledger."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className={source === "live" ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-warning"} aria-hidden="true" />
            {source === "live" ? "Live catalog" : "Demo catalog · simulated balances"}
          </span>
        }
      />
      <CatalogHub products={products} source={source} />
    </main>
  );
}
