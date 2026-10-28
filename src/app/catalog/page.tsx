import type { Metadata } from "next";
import Link from "next/link";

import { CatalogHub } from "@/components/catalog/CatalogHub";
import { PageHeader } from "@/components/shared/PageHeader";
import { fetchPlatformCatalog } from "@/lib/api/platform";
import { getPlatformSession } from "@/lib/api/session";

export const metadata: Metadata = {
  title: "Catalog — Veltron",
  description: "Browse Global Business, Crypto Exchange, Yield Vault and Pro Analytics products.",
};

export default async function CatalogPage() {
  const [result, session] = await Promise.all([fetchPlatformCatalog(), getPlatformSession()]);
  const live = result.status === "ok";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      <PageHeader
        title="Service catalog"
        description="Business formation, exchange execution, yield vaults and analytics — one catalog, one balance, one ledger."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className={live ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-danger"} aria-hidden="true" />
            {live ? "Live platform data" : "Platform unavailable"}
          </span>
        }
      />

      {result.status === "ok" ? (
        <CatalogHub products={result.products} signedIn={Boolean(session)} />
      ) : (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">The catalog could not be loaded</h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Products are read from the platform API at request time. Nothing is shown rather than substituting
            placeholder products, so what you see here is always real.
          </p>
          {result.detail ? <p className="mt-2 font-mono text-xs text-muted-foreground/80">{result.detail}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/login" className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg">
              Sign in
            </Link>
            <Link href="/" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium">
              Back home
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
