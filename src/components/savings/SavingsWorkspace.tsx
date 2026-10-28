"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { CalendarClock, Calculator, Loader2, Lock, Plus, TrendingUp, Wallet } from "lucide-react";

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
import { projectVault } from "@/lib/finance/projection";
import type { SavingsVaultView, VaultSchedule } from "@/lib/finance/vaults";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

const percent = (value: number) => `${value.toFixed(2)}%`;

export function SavingsWorkspace({ vaults }: { vaults: SavingsVaultView[] }) {
  const [open, setOpen] = React.useState(false);
  const [schedule, setSchedule] = React.useState<VaultSchedule>("MONTHLY");
  const [state, formAction, pending] = useActionState<VaultActionState, FormData>(createVaultAction, null);

  const [principal, setPrincipal] = React.useState("1000");
  const [monthly, setMonthly] = React.useState("200");
  const [months, setMonths] = React.useState("12");
  const [projectionApy, setProjectionApy] = React.useState(String(vaults[0]?.apy ?? 4.85));

  React.useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  const totalSaved = vaults.reduce((sum, vault) => sum + vault.balance, 0);
  const weightedApy = totalSaved > 0 ? vaults.reduce((sum, vault) => sum + vault.apy * vault.balance, 0) / totalSaved : 0;

  const projection = React.useMemo(
    () =>
      projectVault({
        principal: Number(principal) || 0,
        monthlyContribution: Number(monthly) || 0,
        apy: Number(projectionApy) || 0,
        months: Number(months) || 0,
      }),
    [principal, monthly, projectionApy, months],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="size-4 text-brand" aria-hidden="true" />Total saved</span>
          <strong className="mt-2 block text-2xl font-semibold tabular-nums tracking-tight">{money(totalSaved)}</strong>
          <p className="mt-1 text-xs text-muted-foreground">{vaults.length} {vaults.length === 1 ? "vault" : "vaults"}</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="size-4 text-success" aria-hidden="true" />Blended APY</span>
          <strong className="mt-2 block text-2xl font-semibold tabular-nums tracking-tight">{percent(weightedApy)}</strong>
          <p className="mt-1 text-xs text-muted-foreground">Weighted by balance</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-4 text-brand" aria-hidden="true" />Locked</span>
          <strong className="mt-2 block text-2xl font-semibold tabular-nums tracking-tight">{vaults.filter((vault) => vault.locked).length}</strong>
          <p className="mt-1 text-xs text-muted-foreground">Fixed-term vaults</p>
        </article>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold"><Calculator className="size-4 text-brand" aria-hidden="true" />Compound calculator</h2>
            <p className="mt-1 text-xs text-muted-foreground">Monthly compounding. Contributions are added at the start of each month.</p>
          </div>
          <Button variant="brand" className="h-11 w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />New vault
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <label className="space-y-1.5 text-xs font-medium">
            Starting amount
            <Input inputMode="decimal" value={principal} onChange={(event) => setPrincipal(event.target.value.replace(/[^0-9.]/g, ""))} className="h-11" />
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            Monthly
            <Input inputMode="decimal" value={monthly} onChange={(event) => setMonthly(event.target.value.replace(/[^0-9.]/g, ""))} className="h-11" />
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            APY (%)
            <Input inputMode="decimal" value={projectionApy} onChange={(event) => setProjectionApy(event.target.value.replace(/[^0-9.]/g, ""))} className="h-11" />
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            Months
            <Input inputMode="numeric" value={months} onChange={(event) => setMonths(event.target.value.replace(/[^0-9]/g, ""))} className="h-11" />
          </label>
        </div>

        <dl className="mt-4 grid gap-3 rounded-lg border border-border bg-surface-2 p-4 sm:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">Projected balance</dt><dd className="mt-1 text-lg font-semibold">{money(projection.finalBalance)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Contributions</dt><dd className="mt-1 text-lg font-semibold">{money(projection.totalContributions)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Interest earned</dt><dd className="mt-1 text-lg font-semibold text-success">{money(projection.totalInterest)}</dd></div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Your vaults</h2>
        {vaults.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <p className="text-sm font-medium">No vaults yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Create one to schedule recurring deposits, or browse the catalog for a yield product.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="brand" className="h-11" onClick={() => setOpen(true)}>Create a vault</Button>
              <Button asChild variant="outline" className="h-11"><Link href="/catalog">Browse catalog</Link></Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {vaults.map((vault) => {
              const progress = vault.target ? Math.min(100, Math.round((vault.balance / vault.target) * 100)) : null;
              return (
                <article key={vault.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">{vault.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{vault.schedule.toLowerCase()} schedule</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      {vault.locked ? <Badge variant="warning"><Lock className="mr-1 size-3" aria-hidden="true" />Locked</Badge> : null}
                      <Badge variant="success">{percent(vault.apy)}</Badge>
                    </div>
                  </div>

                  <p className="mt-4 text-xl font-semibold tabular-nums tracking-tight">{money(vault.balance)}</p>
                  {vault.target ? (
                    <>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={`${vault.name} progress`}>
                        <div className="h-full rounded-full bg-success transition-[width]" style={{ width: `${progress ?? 0}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{progress}% of {money(vault.target)}</p>
                    </>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">No goal set.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88dvh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a vault</DialogTitle>
            <DialogDescription>Posts to the platform API. The vault appears here once the service confirms it.</DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-3">
            <label className="block space-y-1.5 text-sm font-medium">
              Vault name
              <Input name="name" placeholder="Emergency fund" required className="h-11" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 text-sm font-medium">
                APY (%)
                <Input name="apyRate" inputMode="decimal" defaultValue="4.85" required className="h-11" />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Goal (USD)
                <Input name="targetAmount" inputMode="decimal" placeholder="5000.00" className="h-11" />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium">
              Schedule
              <select
                name="schedule"
                value={schedule}
                onChange={(event) => setSchedule(event.target.value as VaultSchedule)}
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>

            {state?.error ? (
              <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">{state.error}</p>
            ) : null}

            <DialogFooter className="gap-2 pt-1 sm:gap-2">
              <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="brand" className="h-11 w-full sm:w-auto" disabled={pending}>
                {pending ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Creating…</> : "Create vault"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
