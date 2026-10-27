"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Bitcoin, CircleDollarSign,
  Clock3, CreditCard, Download, Eye, Plus, RefreshCw, ShieldCheck, Wallet,
  X, Landmark, PiggyBank, ShoppingBag, ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { PriceTicker } from "@/components/shared/PriceTicker";
import { PortfolioDonut, type PortfolioSlice } from "@/components/shared/PortfolioDonut";
import { DataTable } from "@/components/shared/DataTable";
import { Amount } from "@/components/shared/Amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { initialAccounts, initialTransactions, money, openOrders, type DashboardAccount, type DashboardTransaction } from "@/lib/demo/dashboard";

const quickActions = [
  { id: "transfer", label: "Transfer", description: "Move money between accounts", icon: ArrowLeftRight },
  { id: "deposit", label: "Deposit", description: "Add funds to your wallet", icon: ArrowDownLeft },
  { id: "buy", label: "Buy", description: "Explore supported assets", icon: Bitcoin },
  { id: "vault", label: "Create vault", description: "Set aside money for a goal", icon: PiggyBank },
] as const;

const transactionColumns: ColumnDef<DashboardTransaction>[] = [
  { accessorKey: "description", header: "Transaction", cell: ({ row }) => <div className="min-w-36"><p className="font-medium text-foreground">{row.original.description}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.original.id} · {row.original.category}</p></div> },
  { accessorKey: "date", header: "Date", enableSorting: true, cell: ({ getValue }) => <span className="whitespace-nowrap text-muted-foreground">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(String(getValue())))}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => { const status = String(getValue()); return <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-medium " + (status === "Completed" ? "bg-success/10 text-success" : status === "Pending" ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger")}>{status}</span>; } },
  { accessorKey: "amount", header: "Amount", cell: ({ getValue }) => <Amount value={Number(getValue())} signed showSign className="text-sm font-semibold" /> },
];

function StatSkeleton() {
  return <Card><CardHeader className="pb-2"><Skeleton className="h-4 w-28" /></CardHeader><CardContent><Skeleton className="h-8 w-36" /><Skeleton className="mt-3 h-3 w-24" /></CardContent></Card>;
}

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [accounts, setAccounts] = React.useState<DashboardAccount[]>(initialAccounts);
  const [transactions] = React.useState<DashboardTransaction[]>(initialTransactions);
  const [netWorth, setNetWorth] = React.useState(() => initialAccounts.reduce((sum, account) => sum + account.balance, 0));
  const [dayChange, setDayChange] = React.useState(1.84);
  const [updatedAt, setUpdatedAt] = React.useState(() => new Date());
  const [hoveredAllocation, setHoveredAllocation] = React.useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = React.useState<DashboardTransaction | null>(null);
  const [quickDrawerOpen, setQuickDrawerOpen] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState<(typeof quickActions)[number] | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [showBalances, setShowBalances] = React.useState(true);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 400);
    return () => window.clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    let timer: number | undefined;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      const nudge = (Math.random() - 0.47) * 16;
      setNetWorth((current) => Math.max(0, current + nudge));
      setDayChange((current) => Math.max(-9.99, Math.min(9.99, current + (Math.random() - 0.5) * 0.08)));
      setUpdatedAt(new Date());
      setAccounts((current) => current.map((account, index) => index === 1 ? { ...account, balance: Math.max(0, account.balance + (Math.random() - 0.45) * 8) } : account));
    };
    const start = () => { if (timer === undefined && document.visibilityState === "visible") timer = window.setInterval(tick, 3000); };
    const stop = () => { if (timer !== undefined) { window.clearInterval(timer); timer = undefined; } };
    const visibility = () => { if (document.visibilityState === "visible") start(); else stop(); };
    start();
    document.addEventListener("visibilitychange", visibility);
    return () => { stop(); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  const allocations: PortfolioSlice[] = React.useMemo(() => accounts.map((account) => ({ name: account.name, value: account.id === "crypto" ? account.balance : account.balance, color: account.color })), [accounts]);
  const savingsBalance = accounts.find((account) => account.id === "savings")?.balance ?? 0;
  const allocationTotal = allocations.reduce((sum, allocation) => sum + allocation.value, 0);

  function openAction(action: (typeof quickActions)[number]) {
    setSelectedAction(action);
    setQuickDrawerOpen(false);
    setModalOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <PageHeader
        title="Overview"
        description={<>Your financial picture at a glance. <span className="ml-1 text-xs text-muted-foreground">Updated {updatedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}</span></>}
        actions={<>
          <Button variant="outline" onClick={() => setShowBalances((value) => !value)} aria-label={showBalances ? "Hide balances" : "Show balances"}><Eye className="size-4" />{showBalances ? "Hide balances" : "Show balances"}</Button>
          <Button variant="brand" onClick={() => setQuickDrawerOpen(true)}><Plus className="size-4" /> Quick action</Button>
        </>}
      />

      <section aria-label="Account summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }, (_, i) => <StatSkeleton key={i} />) : <>
          <Card className="min-w-0 overflow-hidden"><CardHeader className="flex-row items-start justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Net Worth</CardTitle><span className="rounded-lg bg-brand/10 p-2 text-brand"><Wallet className="size-4" /></span></CardHeader><CardContent><motion.div key={Math.round(netWorth * 100)} initial={reduceMotion ? false : { opacity: 0.65, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="text-2xl font-semibold tracking-tight"><PriceTicker value={showBalances ? netWorth : 0} precision={2} className="px-1" /></motion.div><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-success" /> Across all accounts</p></CardContent></Card>
          <StatCard title="24h Change" value={{ value: dayChange, currency: "fiat", fiatCurrency: "USD", precision: 2, signed: true, showSign: true }} delta={{ percent: Math.abs(dayChange), direction: dayChange > 0 ? "up" : dayChange < 0 ? "down" : "flat", label: "past 24 hours" }} icon={<ArrowUpDown />} />
          <Card><CardHeader className="flex-row items-start justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Savings Balance</CardTitle><span className="rounded-lg bg-success/10 p-2 text-success"><PiggyBank className="size-4" /></span></CardHeader><CardContent><div className="text-2xl font-semibold tracking-tight"><PriceTicker value={showBalances ? savingsBalance : 0} precision={2} /></div><p className="mt-2 text-xs text-muted-foreground">Across your savings vaults</p></CardContent></Card>
          <StatCard title="Open Orders" value={{ value: openOrders.length, precision: 0 }} icon={<Clock3 />} delta={{ percent: 0, direction: "flat", label: "awaiting completion" }} />
        </>}
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="min-w-0">
          <CardHeader className="flex-row items-start justify-between gap-3"><div><CardTitle>Portfolio allocation</CardTitle><p className="mt-1 text-sm text-muted-foreground">How your net worth is distributed</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Demo data</span></CardHeader>
          <CardContent>
            {loading ? <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-56 w-full rounded-xl" /><div className="space-y-4 pt-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div></div> : (
              <div className="grid items-center gap-3 sm:grid-cols-2">
                <div className="relative min-w-0">
                  <PortfolioDonut data={allocations} onHover={(slice) => setHoveredAllocation(slice?.name ?? null)} height={250} />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-1"><span className="text-xs text-muted-foreground">Total value</span><span className="mt-1 text-lg font-semibold tracking-tight">{showBalances ? money(allocationTotal) : "••••••"}</span></div>
                </div>
                <div className="space-y-1" aria-label="Portfolio breakdown">
                  {allocations.map((allocation) => {
                    const account = accounts.find((item) => item.name === allocation.name)!;
                    const active = hoveredAllocation === allocation.name;
                    return <button type="button" key={allocation.name} onMouseEnter={() => setHoveredAllocation(allocation.name)} onMouseLeave={() => setHoveredAllocation(null)} onFocus={() => setHoveredAllocation(allocation.name)} onBlur={() => setHoveredAllocation(null)} className={"flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors " + (active ? "bg-muted ring-1 ring-border" : "hover:bg-muted/60")}><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: allocation.color }} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{allocation.name}</span><span className="text-xs text-muted-foreground">{allocationTotal ? ((allocation.value / allocationTotal) * 100).toFixed(1) : "0.0"}% of portfolio</span></span><span className="text-right text-sm font-semibold tabular-nums">{showBalances ? money(allocation.value) : "••••"}</span></button>;
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader><CardTitle>Accounts & balances</CardTitle><p className="text-sm text-muted-foreground">Select or hover a portfolio segment to highlight it.</p></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="pb-3 font-medium">Account</th><th className="pb-3 text-right font-medium">Balance</th><th className="pb-3 pl-3 text-right font-medium">24h</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id} onMouseEnter={() => setHoveredAllocation(account.name)} onMouseLeave={() => setHoveredAllocation(null)} className={"border-b border-border/70 last:border-0 transition-colors " + (hoveredAllocation === account.name ? "bg-muted" : "")}><td className="py-3 pr-2"><div className="flex items-center gap-2.5"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: account.color }} /><span className="font-medium">{account.name}</span></div></td><td className="py-3 text-right font-mono tabular-nums">{showBalances ? money(account.balance) : "••••"}</td><td className={"py-3 pl-3 text-right font-mono text-xs tabular-nums " + (account.change24h >= 0 ? "text-success" : "text-danger")}>{account.change24h > 0 ? "+" : ""}{account.change24h.toFixed(2)}%</td></tr>)}</tbody></table></div>}
            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 p-3"><span className="text-sm text-muted-foreground">Combined balance</span><span className="font-semibold tabular-nums">{showBalances ? money(allocationTotal) : "••••••"}</span></div>
          </CardContent>
        </Card>
      </section>

      <Card className="min-w-0">
        <CardHeader className="flex-row items-start justify-between gap-3"><div><CardTitle>Recent transactions</CardTitle><p className="mt-1 text-sm text-muted-foreground">Your latest account activity. Select a row for details.</p></div><Button variant="outline" size="sm" onClick={() => toast.info("Transaction export is a demo preview.")}><Download className="size-4" /> Export</Button></CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : <DataTable columns={transactionColumns} data={transactions} pageSize={10} searchPlaceholder="Search transactions…" onRowClick={(transaction) => setSelectedTransaction(transaction)} emptyTitle="No transactions yet" emptyDescription="Your recent activity will appear here." />}
        </CardContent>
      </Card>

      <Sheet open={quickDrawerOpen} onOpenChange={setQuickDrawerOpen}>
        <SheetContent side="right" className="flex flex-col overflow-y-auto bg-background text-foreground sm:max-w-md">
          <SheetHeader><SheetTitle className="text-xl">Quick actions</SheetTitle><SheetDescription>Choose what you’d like to do next.</SheetDescription></SheetHeader>
          <div className="mt-6 space-y-3">{quickActions.map((action) => {const Icon = action.icon;return <button type="button" key={action.id} onClick={() => openAction(action)} className="flex w-full items-center gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="block font-medium">{action.label}</span><span className="mt-1 block text-sm text-muted-foreground">{action.description}</span></span><ArrowUpRight className="size-4 text-muted-foreground" /></button>;})}</div>
          <div className="mt-auto rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Actions are placeholders in this demo. No funds will move.</div>
        </SheetContent>
      </Sheet>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedAction ? selectedAction.label : "Quick action"}</DialogTitle><DialogDescription>{selectedAction?.description ?? "Choose an action to continue."}</DialogDescription></DialogHeader>
          <div className="rounded-xl border border-border bg-muted/40 p-5"><div className="mb-3 grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">{selectedAction ? React.createElement(selectedAction.icon, { className: "size-5" }) : <CircleDollarSign className="size-5" />}</div><p className="font-medium">Coming soon</p><p className="mt-1 text-sm leading-6 text-muted-foreground">This {selectedAction?.label.toLowerCase() ?? "action"} flow is a UI placeholder. Connect a verified provider and authenticated server action before enabling real transactions.</p></div>
          <div className="flex justify-end"><Button variant="outline" onClick={() => setModalOpen(false)}><X className="size-4" /> Close</Button></div>
        </DialogContent>
      </Dialog>

      <Sheet open={selectedTransaction !== null} onOpenChange={(open) => { if (!open) setSelectedTransaction(null); }}>
        <SheetContent side="right" className="overflow-y-auto bg-background text-foreground sm:max-w-md">
          {selectedTransaction ? <><SheetHeader><SheetTitle>Transaction details</SheetTitle><SheetDescription>{selectedTransaction.id} · {selectedTransaction.category}</SheetDescription></SheetHeader>
            <div className="mt-8 rounded-xl border border-border p-5 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-brand/10 text-brand"><CreditCard className="size-5" /></span><p className="mt-4 text-sm text-muted-foreground">{selectedTransaction.description}</p><p className="mt-2 text-3xl font-semibold tracking-tight"><Amount value={selectedTransaction.amount} signed showSign /></p><span className={"mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium " + (selectedTransaction.status === "Completed" ? "bg-success/10 text-success" : selectedTransaction.status === "Pending" ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger")}>{selectedTransaction.status}</span></div>
            <div className="mt-6 space-y-4">{[["Date", new Date(selectedTransaction.date).toLocaleString()],["Reference",selectedTransaction.reference],["Transaction ID",selectedTransaction.id],["Category",selectedTransaction.category]].map(([label,value])=><div key={label} className="flex items-start justify-between gap-4 border-b border-border pb-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="max-w-[65%] break-words text-right font-medium">{value}</span></div>)}</div>
            <div className="mt-6 rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">Demo transaction details only. This panel does not reflect a live banking ledger.</div>
          </> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
