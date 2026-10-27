// Deterministic demo data for the Analytics workspace. No live account data is
// used here: rows are generated from a fixed seed so tables, charts and exports
// stay stable across reloads and tests.

export type LedgerType = "Income" | "Expense" | "Transfer" | "Refund";
export type LedgerStatus = "Completed" | "Pending" | "Failed";

export type LedgerRow = {
  id: string;
  date: string; // ISO 8601 (UTC)
  type: LedgerType;
  category: string;
  description: string;
  amount: number; // signed USD
  status: LedgerStatus;
  reference: string;
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string; // ISO 8601 (UTC)
};

export type CategoryMeta = { type: LedgerType; color: string; templates: string[]; min: number; max: number };

export const CATEGORY_META: Record<string, CategoryMeta> = {
  Salary: { type: "Income", color: "var(--color-success)", templates: ["Monthly salary", "Contract retainer", "Bonus payout"], min: 2400, max: 5200 },
  Freelance: { type: "Income", color: "var(--color-brand)", templates: ["Client project invoice", "Consulting engagement", "Design sprint payout"], min: 450, max: 3400 },
  Interest: { type: "Income", color: "var(--color-warning)", templates: ["Savings interest", "Vault yield", "Cash account dividend"], min: 12, max: 240 },
  Bills: { type: "Expense", color: "var(--color-danger)", templates: ["Electricity bill", "Internet subscription", "Water and waste", "Insurance premium"], min: 38, max: 320 },
  Groceries: { type: "Expense", color: "var(--color-warning)", templates: ["Supermarket run", "Weekly groceries", "Corner store top-up"], min: 18, max: 220 },
  Dining: { type: "Expense", color: "var(--color-danger)", templates: ["Dinner with team", "Coffee shop", "Lunch delivery"], min: 6, max: 140 },
  Transport: { type: "Expense", color: "var(--color-brand)", templates: ["Ride share", "Fuel stop", "Transit pass"], min: 9, max: 180 },
  Shopping: { type: "Expense", color: "var(--color-brand)", templates: ["Online purchase", "Electronics order", "Home supplies"], min: 24, max: 620 },
  Subscriptions: { type: "Expense", color: "var(--color-muted-foreground)", templates: ["Software licence", "Cloud storage plan", "Streaming plan", "Analytics suite"], min: 9, max: 120 },
  Health: { type: "Expense", color: "var(--color-success)", templates: ["Pharmacy order", "Dental check-up", "Gym membership"], min: 22, max: 280 },
  Savings: { type: "Transfer", color: "var(--color-warning)", templates: ["Vault contribution", "Goal funding transfer", "Auto-save sweep"], min: 50, max: 800 },
  Crypto: { type: "Transfer", color: "var(--color-brand)", templates: ["Bitcoin purchase", "USDC acquired", "Exchange withdrawal", "Wallet rebalance"], min: 60, max: 1500 },
};

export const LEDGER_CATEGORIES = Object.keys(CATEGORY_META);
export const LEDGER_TYPES: LedgerType[] = ["Income", "Expense", "Transfer", "Refund"];

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fixed anchor date keeps the demo dataset deterministic (last ~180 days).
const BASE_TIME = Date.parse("2026-10-27T12:00:00Z");
const DAY = 86_400_000;

const WEIGHTED_CATEGORIES: [string, number][] = [
  ["Shopping", 16], ["Dining", 14], ["Bills", 12], ["Subscriptions", 10], ["Transport", 10],
  ["Groceries", 9], ["Crypto", 7], ["Savings", 6], ["Freelance", 5], ["Salary", 3],
  ["Health", 4], ["Interest", 4],
];

function pick<T>(random: () => number, items: T[]): T {
  return items[Math.floor(random() * items.length)];
}

function pickWeighted(random: () => number): string {
  const total = WEIGHTED_CATEGORIES.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [category, weight] of WEIGHTED_CATEGORIES) {
    roll -= weight;
    if (roll <= 0) return category;
  }
  return WEIGHTED_CATEGORIES[0][0];
}

function buildLedger(): LedgerRow[] {
  const random = mulberry32(20261027);
  const rows: LedgerRow[] = [];
  for (let index = 0; index < 140; index += 1) {
    const category = pickWeighted(random);
    const meta = CATEGORY_META[category];
    const isRefund = category === "Shopping" && random() < 0.12;
    const type: LedgerType = isRefund ? "Refund" : meta.type;
    const magnitude = Math.round((meta.min + random() * (meta.max - meta.min)) * 100) / 100;
    const amount = type === "Income" || type === "Refund" ? magnitude : -magnitude;
    const daysAgo = Math.floor(random() * 180);
    const date = new Date(BASE_TIME - daysAgo * DAY - Math.floor(random() * DAY)).toISOString();
    const roll = random();
    const status: LedgerStatus = roll < 0.88 ? "Completed" : roll < 0.97 ? "Pending" : "Failed";
    const suffix = pick(random, ["", " · card ·4421", " · via wallet", " · autopay", " · manual entry"]);
    rows.push({
      id: `LED-${String(1000 - index).padStart(4, "0")}`,
      date,
      type,
      category,
      description: `${pick(random, meta.templates)}${suffix}`,
      amount,
      status,
      reference: `VL-${type.slice(0, 3).toUpperCase()}-${8000 - index}`,
    });
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function buildAudit(): AuditEvent[] {
  const random = mulberry32(884422);
  const actors = [
    "ada.nwosu@example.com", "jordan.lee@example.com", "sam.oyelaran@example.com",
    "priya.shah@example.com", "billing-bot@system", "reconciliation-worker@system",
  ];
  const actions: [string, string][] = [
    ["AUTH.SIGN_IN", "session"], ["AUTH.SIGN_OUT", "session"], ["AUTH.PASSWORD_UPDATED", "account"],
    ["AUTH.TWO_FACTOR_ENABLED", "account"], ["LEDGER.EXPORT_CSV", "analytics"], ["PROFILE.UPDATED", "account"],
    ["ORDER.CREATED", "order"], ["SESSION.REVOKED", "session"], ["DOCUMENT.DOWNLOADED", "document"],
    ["WALLET.VIEWED", "wallet"],
  ];
  const events: AuditEvent[] = [];
  for (let index = 0; index < 64; index += 1) {
    const [action, entity] = pick(random, actions);
    const timestamp = new Date(BASE_TIME - Math.floor(random() * 90 * DAY) - Math.floor(random() * DAY)).toISOString();
    events.push({
      id: `AUD-${String(5000 - index).padStart(4, "0")}`,
      actor: pick(random, actors),
      action,
      target: `${entity}:${String(1000 + Math.floor(random() * 8999))}`,
      timestamp,
    });
  }
  return events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0));
}

/* ------------------------------------------------------------------ filters */

// Built after every constant and helper above so module init never hits a TDZ error.
export const ledgerEntries: LedgerRow[] = buildLedger();
export const auditEvents: AuditEvent[] = buildAudit();

export type LedgerFilters = { from?: string; to?: string; categories?: string[]; query?: string };

const dateOnly = (iso: string) => iso.slice(0, 10);

export function filterLedger(rows: LedgerRow[], filters: LedgerFilters = {}): LedgerRow[] {
  const { from = "", to = "", categories, query = "" } = filters;
  const selected = categories && categories.length > 0 ? new Set(categories) : null;
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => {
    const day = dateOnly(row.date);
    if (from && day < from) return false;
    if (to && day > to) return false;
    if (selected && !selected.has(row.category)) return false;
    if (needle) {
      const haystack = `${row.description} ${row.category} ${row.type} ${row.status} ${row.reference} ${row.id}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function filterAudit(rows: AuditEvent[], query = ""): AuditEvent[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => `${row.actor} ${row.action} ${row.target} ${row.id}`.toLowerCase().includes(needle));
}

export function hasActiveFilters(filters: LedgerFilters): boolean {
  return Boolean(filters.from || filters.to || (filters.categories && filters.categories.length > 0) || filters.query?.trim());
}

/* ------------------------------------------------------------------- charts */

export type FlowPoint = { label: string; month: string; income: number; expense: number };
export type CategoryTotal = { category: string; total: number; color: string };

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthlyFlow(rows: LedgerRow[]): FlowPoint[] {
  const buckets = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    const month = dateOnly(row.date).slice(0, 7);
    const bucket = buckets.get(month) ?? { income: 0, expense: 0 };
    if (row.amount >= 0) bucket.income += row.amount;
    else bucket.expense += Math.abs(row.amount);
    buckets.set(month, bucket);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, bucket]) => {
      const [year, monthIndex] = month.split("-");
      return {
        month,
        label: `${MONTH_LABELS[Number(monthIndex) - 1]} ${year.slice(2)}`,
        income: Math.round(bucket.income * 100) / 100,
        expense: Math.round(bucket.expense * 100) / 100,
      };
    });
}

export function categoryTotals(rows: LedgerRow[]): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.amount >= 0) continue;
    totals.set(row.category, (totals.get(row.category) ?? 0) + Math.abs(row.amount));
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100, color: CATEGORY_META[category]?.color ?? "var(--color-brand)" }))
    .sort((a, b) => b.total - a.total);
}

/* ------------------------------------------------------------------ exports */

function escapeCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

export function ledgerCsv(rows: LedgerRow[]): string {
  return toCsv(
    ["Date", "Type", "Category", "Description", "Amount", "Status", "Reference"],
    rows.map((row) => [dateOnly(row.date), row.type, row.category, row.description, row.amount.toFixed(2), row.status, row.reference]),
  );
}

export function auditCsv(rows: AuditEvent[]): string {
  return toCsv(
    ["Timestamp", "Actor", "Action", "Target", "Event ID"],
    rows.map((row) => [row.timestamp, row.actor, row.action, row.target, row.id]),
  );
}

// Client-side download of a generated CSV. No server round trip.
export function downloadCsv(filename: string, csv: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------------------------------------------------------------- formatting */

// Hand-rolled so server and client always render the same string (no ICU drift).
export function formatLedgerDate(iso: string): string {
  const [year, month, day] = dateOnly(iso).split("-");
  return `${day} ${MONTH_LABELS[Number(month) - 1]} ${year}`;
}

export function formatLedgerDateTime(iso: string): string {
  const [day, time] = iso.split("T");
  return `${formatLedgerDate(day)} · ${time.slice(0, 5)} UTC`;
}

export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

export function exportFilename(kind: "ledger" | "audit"): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `veltron-${kind}-${stamp}.csv`;
}
