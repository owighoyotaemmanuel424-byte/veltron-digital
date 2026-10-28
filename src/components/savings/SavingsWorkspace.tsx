"use client";

import * as React from "react";
import { toast } from "sonner";
import { CalendarClock, Calculator, Lock, Plus, TrendingUp, Wallet } from "lucide-react";

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
import { projectVault } from "@/lib/finance/projection";
import type { SavingsVaultView } from "@/lib/demo/savings";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

const percent = (value: number) => `${value.toFixed(2)}%`;

type Schedule = SavingsVaultView["schedule"];

export function SavingsWorkspace({ vaults: initialVaults, source }: { vaults: SavingsVaultView[]; source: "live" | "demo" }) {
  const [vaults, setVaults] = React.useState(initialVaults);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [apy, setApy] = React.useState("4.85");
  const [target, setTarget] = React.useState("5000");
  const [schedule, setSchedule] = React.useState<Schedule>("MONTHLY");

  const [principal, setPrincipal] = React.useState("1000");
  const [monthly, setMonthly] = React.useState("200");
  const [months, setMonths] = React.useState("12");
  const [projectionApy, setProjectionApy] = React.useState("4.85");

  const totalSaved = vaults.reduce((sum, vault) => sum + vault.balance, 0);
  const weightedApy =
    totalSaved > 0 ? vaults.reduce((sum, vault) => sum + vault.apy * vault.balance, 0) / totalSaved : 0;

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

  const createVault = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Give the vault a name.");
      return;
    }
    const parsedApy = Number(apy);
    if (!Number.isFinite(parsedApy) || parsedApy < 0 || parsedApy > 30) {
      toast.error("APY must be between 0 and 30%.");
      return;
    }
    const parsedTarget = Number(target);
    const vault: SavingsVaultView = {
      id: `vault-${Date.now()}`,
      name: trimmed,
      balance: 0,
      target: Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : null,
      apy: parsedApy,
      schedule,
      locked: false,
    };
    setVaults((current) => [vault, ...current]);
    setOpen(false);
    setName("");
    toast.success(`${trimmed} created`, {
      description: `${percent(parsedApy)} APY · ${schedule.toLowerCase()} schedule${vault.target ? ` · ${money(vault.target)} goal` : ""}`,
    });
  };

  return (
    <div className="space-y-6">
      {source === "demo" ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Showing demo vaults — sign in through the platform API to load your own balances.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="size-4 text-brand" aria-hidden="true" />Total saved</span>
          <strong className="mt-2 block text-2xl font-semibold tracking-tight">{money(totalSaved)}</strong>
          <p className="mt-1 text-xs text-muted-foreground">{vaults.length} active {vaults.length === 1 ? "vault" : "vaults"}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="size-4 text-success" aria-hidden="true" />Blended APY</span>
          <strong className="mt-2 block text-2xl font-semibold tracking-tight">{percent(weightedApy)}</strong>
          <p className="mt-1 text-xs text-muted-foreground">Weighted by vault balance</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-4 text-brand" aria-hidden="true" />Locked</span>
          <strong className="mt-2 block text-2xl font-semibold tracking-tight">{vaults.filter((vault) => vault.locked).length}</strong>
          <p className="mt-1 text-xs text-muted-foreground">Vaults with a fixed term</p>
        </article>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold"><Calculator className="size-4 text-brand" aria-hidden="true" />Compound calculator</h2>
            <p className="mt-1 text-xs text-muted-foreground">Monthly compounding. Contributions are added at the start of each month.</p>
          </div>
          <Button variant="brand" size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />New vault
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5 text-xs font-medium">
            Starting amount
            <Input inputMode="decimal" value={principal} onChange={(event) => setPrincipal(event.target.value.replace(/[^0-9.]/g, ""))} />
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            Monthly contribution
            <Input inputMode="decimal" value={monthly} onChange={(event) => setMonthly(event.target.value.replace(/[^0-9.]/g, ""))} />
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            APY (%)
            <Input inputMode="decimal" value={projectionApy} onChange={(event) => setProjectionApy(event.target.value.replace(/[^0-9.]/g, ""))} />
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            Months
            <Input inputMode="numeric" value={months} onChange={(event) => setMonths(event.target.value.replace(/[^0-9]/g, ""))} />
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
            <p className="mt-1 text-xs text-muted-foreground">Create one to start scheduling recurring deposits.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {vaults.map((vault) => {
              const progress = vault.target ? Math.min(100, Math.round((vault.balance / vault.target) * 100)) : null;
              return (
                <article key={vault.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">{vault.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{vault.schedule.toLowerCase()} schedule</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {vault.locked ? <Badge variant="warning"><Lock className="mr-1 size-3" aria-hidden="true" />Locked</Badge> : null}
                      <Badge variant="success">{percent(vault.apy)} APY</Badge>
                    </div>
                  </div>

                  <p className="mt-4 text-xl font-semibold tracking-tight">{money(vault.balance)}</p>
                  {vault.target ? (
                    <>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={`${vault.name} progress`}>
                        <div className="h-full rounded-full bg-success transition-[width]" style={{ width: `${progress ?? 0}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{progress}% of {money(vault.target)} goal</p>
                    </>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">No goal set — accrues until withdrawn at maturity.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a vault</DialogTitle>
            <DialogDescription>Pick a rate and schedule. Deposits post to the ledger when you fund the vault.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="block space-y-1.5 text-sm font-medium">
              Vault name
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Emergency fund" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 text-sm font-medium">
                APY (%)
                <Input inputMode="decimal" value={apy} onChange={(event) => setApy(event.target.value.replace(/[^0-9.]/g, ""))} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Target (USD)
                <Input inputMode="decimal" value={target} onChange={(event) => setTarget(event.target.value.replace(/[^0-9.]/g, ""))} />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium">
              Recurring schedule
              <select
                value={schedule}
                onChange={(event) => setSchedule(event.target.value as Schedule)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="brand" onClick={createVault}>Create vault</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
