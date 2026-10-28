import { PageHeader } from "@/components/shared/PageHeader";
import { SavingsWorkspace } from "@/components/savings/SavingsWorkspace";
import { fetchPlatformVaults } from "@/lib/api/platform";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  // No session token is available to the demo workspace yet, so this resolves to
  // the bundled vaults; the page renders identically once one is supplied.
  const { vaults, source } = await fetchPlatformVaults();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings & vaults"
        description="Flexible and locked vaults with hourly accrual, plus a compound calculator to project a schedule before you commit."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className={source === "live" ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-warning"} aria-hidden="true" />
            {source === "live" ? "Live vaults" : "Demo vaults"}
          </span>
        }
      />
      <SavingsWorkspace vaults={vaults} source={source} />
    </div>
  );
}
