"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, Download, FileText, RotateCcw } from "lucide-react";

import { Amount } from "@/components/shared/Amount";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  auditCsv,
  auditEvents,
  categoryTotals,
  CATEGORY_META,
  downloadCsv,
  exportFilename,
  filterAudit,
  filterLedger,
  formatLedgerDate,
  formatLedgerDateTime,
  hasActiveFilters,
  LEDGER_CATEGORIES,
  ledgerCsv,
  ledgerEntries,
  money,
  monthlyFlow,
  type AuditEvent,
  type CategoryTotal,
  type FlowPoint,
  type LedgerRow,
  type LedgerStatus,
} from "@/lib/demo/analytics";

type Tab = "ledger" | "audit";

const STATUS_VARIANT: Record<LedgerStatus, "success" | "warning" | "danger"> = {
  Completed: "success",
  Pending: "warning",
  Failed: "danger",
};

const tooltipStyle: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-foreground)",
  fontSize: 12,
};

const axisTick = { fontSize: 12, fill: "var(--color-muted-foreground)" };

const compactMoney = (value: number) => {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(Math.abs(value) >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(value)}`;
};

function CategoryPill({ category }: { category: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 whitespace-nowrap font-medium">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ background: CATEGORY_META[category]?.color ?? "var(--color-brand)" }} />
      {category}
    </Badge>
  );
}

const ledgerColumns: ColumnDef<LedgerRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatLedgerDate(row.original.date)}</span>,
  },
  { accessorKey: "type", header: "Type", cell: ({ row }) => <span className="whitespace-nowrap">{row.original.type}</span> },
  { accessorKey: "category", header: "Category", cell: ({ row }) => <CategoryPill category={row.original.category} /> },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="block max-w-[16rem] truncate" title={row.original.description}>
        {row.original.description}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    sortingFn: (left, right) => left.original.amount - right.original.amount,
    cell: ({ row }) => (
      <span className="flex justify-end">
        <Amount value={row.original.amount} signed />
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>,
  },
];

const auditColumns: ColumnDef<AuditEvent>[] = [
  {
    accessorKey: "actor",
    header: "Actor",
    cell: ({ row }) => (
      <span className="block max-w-[14rem] truncate font-mono text-xs" title={row.original.actor}>
        {row.original.actor}
      </span>
    ),
  },
  { accessorKey: "action", header: "Action", cell: ({ row }) => <Badge variant="secondary" className="whitespace-nowrap font-mono text-xs">{row.original.action}</Badge> },
  { accessorKey: "target", header: "Target", cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{row.original.target}</span> },
  { accessorKey: "timestamp", header: "Timestamp", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatLedgerDateTime(row.original.timestamp)}</span> },
];

function ChartPlaceholder({ label }: { label: string }) {
  return <p className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">{label}</p>;
}

function FlowChart({ data }: { data: FlowPoint[] }) {
  if (data.length === 0) return <ChartPlaceholder label="No cash flow in the selected range." />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
        <YAxis tickLine={false} axisLine={false} tick={axisTick} width={52} tickFormatter={(value: number) => compactMoney(value)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [money(Number(value)), String(name)]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="income" name="Income" stackId="1" stroke="var(--color-success)" fill="var(--color-success)" fillOpacity={0.35} strokeWidth={2} />
        <Area type="monotone" dataKey="expense" name="Expense" stackId="1" stroke="var(--color-danger)" fill="var(--color-danger)" fillOpacity={0.35} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CategoryChart({ data }: { data: CategoryTotal[] }) {
  if (data.length === 0) return <ChartPlaceholder label="No expenses in the selected range." />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} tick={axisTick} tickFormatter={(value: number) => compactMoney(value)} />
        <YAxis type="category" dataKey="category" width={104} tickLine={false} axisLine={false} tick={axisTick} />
        <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={tooltipStyle} formatter={(value) => [money(Number(value)), "Spent"]} />
        <Bar dataKey="total" name="Spent" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((entry) => (
            <Cell key={entry.category} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = React.useState<Tab>("ledger");
  const [range, setRange] = React.useState({ from: "", to: "" });
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [ledgerQuery, setLedgerQuery] = React.useState("");
  const [auditQuery, setAuditQuery] = React.useState("");

  const ledgerFilters = React.useMemo(
    () => ({ from: range.from, to: range.to, categories: selectedCategories, query: ledgerQuery }),
    [range.from, range.to, selectedCategories, ledgerQuery],
  );

  const filteredLedger = React.useMemo(() => filterLedger(ledgerEntries, ledgerFilters), [ledgerFilters]);
  const filteredAudit = React.useMemo(() => filterAudit(auditEvents, auditQuery), [auditQuery]);
  const flow = React.useMemo(() => monthlyFlow(filteredLedger), [filteredLedger]);
  const spending = React.useMemo(() => categoryTotals(filteredLedger), [filteredLedger]);

  const toggleCategory = (category: string) =>
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((entry) => entry !== category) : [...current, category],
    );

  const resetFilters = () => {
    setRange({ from: "", to: "" });
    setSelectedCategories([]);
    setLedgerQuery("");
  };

  const filtersActive = hasActiveFilters(ledgerFilters);

  const handleExportCsv = () => {
    if (tab === "ledger") downloadCsv(exportFilename("ledger"), ledgerCsv(filteredLedger));
    else downloadCsv(exportFilename("audit"), auditCsv(filteredAudit));
  };

  const handleExportPdf = () => {
    // Stub export: the browser print dialog offers "Save as PDF" (pdf-lib is not a dependency).
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Ledger activity, cash-flow trends, and the audit trail for your workspace. Demo data is shown for illustration."
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1" role="group" aria-label="Export current view">
            <Button type="button" variant="ghost" size="sm" onClick={handleExportPdf} title="Open the print dialog to save this view as PDF">
              <FileText aria-hidden="true" /> PDF
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleExportCsv}
              title={`Download the ${tab === "ledger" ? "ledger" : "audit"} rows shown as CSV`}
            >
              <Download aria-hidden="true" /> CSV
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <label htmlFor="ledger-from" className="block text-xs font-medium text-muted-foreground">From</label>
                <Input
                  id="ledger-from"
                  type="date"
                  value={range.from}
                  max={range.to || undefined}
                  onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))}
                  className="h-9 w-[9.5rem]"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="ledger-to" className="block text-xs font-medium text-muted-foreground">To</label>
                <Input
                  id="ledger-to"
                  type="date"
                  value={range.to}
                  min={range.from || undefined}
                  onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))}
                  className="h-9 w-[9.5rem]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground" id="ledger-categories-label">Categories</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 justify-between gap-2"
                    aria-label={selectedCategories.length > 0 ? `Categories: ${selectedCategories.length} selected` : "Categories: all"}
                  >
                    <span>{selectedCategories.length > 0 ? `${selectedCategories.length} selected` : "All categories"}</span>
                    <ChevronDown aria-hidden="true" className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-2">
                  <div className="flex items-center justify-between px-2 pb-2 text-xs text-muted-foreground">
                    <span>Multi-select</span>
                    <button
                      type="button"
                      className="rounded px-1 py-0.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setSelectedCategories([])}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {LEDGER_CATEGORIES.map((category) => (
                      <label
                        key={category}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent focus-within:bg-accent"
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--brand)]"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                        />
                        <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: CATEGORY_META[category].color }} />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-3 self-end sm:ml-auto">
              <span className="text-xs text-muted-foreground" role="status">
                {filteredLedger.length} of {ledgerEntries.length} entries
              </span>
              <Button type="button" variant="ghost" size="sm" className="h-9" onClick={resetFilters} disabled={!filtersActive}>
                <RotateCcw aria-hidden="true" /> Reset
              </Button>
            </div>
          </div>

          <DataTable
            columns={ledgerColumns}
            data={filteredLedger}
            searchPlaceholder="Search description, reference, status…"
            searchValue={ledgerQuery}
            onSearchChange={(value) => {
              setLedgerQuery(value);
            }}
            virtualized
            pageSize={20}
            emptyTitle="No ledger entries match"
            emptyDescription="Widen the date range, pick more categories, or clear the search."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cash flow</CardTitle>
                <p className="text-sm text-muted-foreground">Income and expense stacked by month for the current filters.</p>
              </CardHeader>
              <CardContent>
                <FlowChart data={flow} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Spend by category</CardTitle>
                <p className="text-sm text-muted-foreground">Outgoing amounts grouped by ledger category.</p>
              </CardHeader>
              <CardContent>
                <CategoryChart data={spending} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <p className="text-sm text-muted-foreground">Security and account events recorded for this workspace.</p>
            <span className="text-xs text-muted-foreground" role="status">
              {filteredAudit.length} of {auditEvents.length} events
            </span>
          </div>

          <DataTable
            columns={auditColumns}
            data={filteredAudit}
            searchPlaceholder="Search actor, action, or target…"
            searchValue={auditQuery}
            onSearchChange={(value) => {
              setAuditQuery(value);
            }}
            virtualized
            pageSize={20}
            emptyTitle="No audit events match"
            emptyDescription="Try a different actor, action, or target."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
