import Link from "next/link";

import { PageHeader } from "@/components/shared/PageHeader";
import { SavingsWorkspace } from "@/components/savings/SavingsWorkspace";
import { fetchPlatformVaults } from "@/lib/api/platform";
import { getPlatformSession } from "@/lib/api/session";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const session = await getPlatformSession();
  const result = await fetchPlatformVaults({ accessToken: session?.accessToken });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings & vaults"
        description="Flexible and locked vaults with hourly accrual, plus a compound calculator to project a schedule before you commit."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className={result.status === "ok" ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-danger"} aria-hidden="true" />
            {result.status === "ok" ? "Live platform data" : "Platform unavailable"}
          </span>
        }
      />

      {result.status === "ok" ? (
        <SavingsWorkspace vaults={result.vaults} />
      ) : (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">
            {result.reason === "not_signed_in" ? "Sign in to see your vaults" : "Savings service unavailable"}
          </h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            {result.reason === "not_signed_in"
              ? "Vault balances are personal, so this page needs a platform session before it can read them."
              : "The platform API did not return vault data. Balances are not shown rather than replaced with placeholder figures."}
          </p>
          {result.detail ? <p className="mt-2 font-mono text-xs text-muted-foreground/80">{result.detail}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/login" className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg">
              {result.reason === "not_signed_in" ? "Sign in" : "Re-authenticate"}
            </Link>
            <Link href="/catalog" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium">
              Browse catalog
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
