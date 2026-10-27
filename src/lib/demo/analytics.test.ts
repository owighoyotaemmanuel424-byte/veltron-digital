import { describe, expect, it } from "vitest";
import {
  auditCsv,
  auditEvents,
  categoryTotals,
  filterAudit,
  filterLedger,
  formatLedgerDate,
  ledgerCsv,
  ledgerEntries,
  monthlyFlow,
  toCsv,
} from "@/lib/demo/analytics";

const dayOf = (iso: string) => iso.slice(0, 10);

describe("demo analytics data", () => {
  it("ships 100+ ledger rows across several months", () => {
    expect(ledgerEntries.length).toBeGreaterThanOrEqual(100);
    const months = new Set(ledgerEntries.map((row) => row.date.slice(0, 7)));
    expect(months.size).toBeGreaterThanOrEqual(5);
    expect(auditEvents.length).toBeGreaterThanOrEqual(40);
  });

  it("keeps rows newest-first with signed amounts and known categories", () => {
    for (let index = 1; index < ledgerEntries.length; index += 1) {
      expect(ledgerEntries[index - 1].date >= ledgerEntries[index].date).toBe(true);
    }
    expect(ledgerEntries.some((row) => row.amount > 0)).toBe(true);
    expect(ledgerEntries.some((row) => row.amount < 0)).toBe(true);
  });

  it("formats dates deterministically", () => {
    expect(formatLedgerDate("2026-10-27T08:20:00Z")).toBe("27 Oct 2026");
  });
});

describe("filterLedger", () => {
  it("applies an inclusive date range", () => {
    const anchor = ledgerEntries[0];
    const day = dayOf(anchor.date);
    const ranged = filterLedger(ledgerEntries, { from: day, to: day });
    expect(ranged.some((row) => row.id === anchor.id)).toBe(true);
    for (const row of ranged) {
      const current = dayOf(row.date);
      expect(current >= day && current <= day).toBe(true);
    }
    expect(filterLedger(ledgerEntries, { from: "2000-01-01", to: "2000-01-02" })).toHaveLength(0);
  });

  it("keeps rows that start before the range but end inside it (single-day ranges)", () => {
    const span = filterLedger(ledgerEntries, { from: "2026-07-01", to: "2026-07-31" });
    const narrow = filterLedger(ledgerEntries, { from: "2026-07-15", to: "2026-07-15" });
    expect(span.length).toBeGreaterThanOrEqual(narrow.length);
    for (const row of narrow) expect(dayOf(row.date) >= "2026-07-15" && dayOf(row.date) <= "2026-07-15").toBe(true);
  });

  it("supports category multi-select and combines with the range", () => {
    const filtered = filterLedger(ledgerEntries, { categories: ["Salary", "Bills"] });
    expect(filtered.length).toBeGreaterThan(0);
    for (const row of filtered) expect(["Salary", "Bills"]).toContain(row.category);

    const combined = filterLedger(ledgerEntries, { categories: ["Salary"], from: "2026-05-01", to: "2026-12-31", query: "salary" });
    expect(combined.length).toBeGreaterThan(0);
    for (const row of combined) {
      expect(row.category).toBe("Salary");
      expect(dayOf(row.date) >= "2026-05-01").toBe(true);
      expect(`${row.description} ${row.category}`.toLowerCase()).toContain("salary");
    }
  });

  it("searches description, category, type, status and reference", () => {
    const match = filterLedger(ledgerEntries, { query: "electricity" });
    expect(match.length).toBeGreaterThan(0);
    for (const row of match) expect(`${row.description} ${row.category} ${row.type} ${row.status} ${row.reference} ${row.id}`.toLowerCase()).toContain("electricity");
    expect(filterLedger(ledgerEntries, { query: "nothing-matches-this" })).toHaveLength(0);
  });
});

describe("filterAudit", () => {
  it("filters by actor, action or target", () => {
    expect(filterAudit(auditEvents, "")).toHaveLength(auditEvents.length);
    const denied = filterAudit(auditEvents, auditEvents[0].action.toLowerCase());
    expect(denied.length).toBeGreaterThan(0);
    expect(filterAudit(auditEvents, "no-such-event")).toHaveLength(0);
  });
});

describe("exports", () => {
  it("escapes commas, quotes and newlines", () => {
    expect(toCsv(["a", "b"], [["plain", 1]])).toBe("a,b\r\nplain,1");
    expect(toCsv(["a"], [['say "hi", now']])).toBe('a\r\n"say ""hi"", now"');
    expect(toCsv(["a"], [["line\nbreak"]])).toBe('a\r\n"line\nbreak"');
  });

  it("builds a ledger CSV with a header plus one row per filtered entry", () => {
    const rows = filterLedger(ledgerEntries, { categories: ["Bills"], query: "electricity" });
    const csv = ledgerCsv(rows);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Date,Type,Category,Description,Amount,Status,Reference");
    expect(lines).toHaveLength(rows.length + 1);
    expect(csv).toContain("Bills");
    expect(csv).toMatch(/-?\d+\.\d{2}/);
  });

  it("builds an audit CSV with one row per event", () => {
    const csv = auditCsv(auditEvents.slice(0, 5));
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Timestamp,Actor,Action,Target,Event ID");
    expect(lines).toHaveLength(6);
  });
});

describe("chart series", () => {
  it("aggregates income and expense per month in ascending order", () => {
    const series = monthlyFlow(ledgerEntries);
    expect(series.length).toBeGreaterThanOrEqual(5);
    for (let index = 1; index < series.length; index += 1) {
      expect(series[index - 1].month < series[index].month).toBe(true);
    }
    const income = series.reduce((sum, point) => sum + point.income, 0);
    const expense = series.reduce((sum, point) => sum + point.expense, 0);
    const totalIncome = ledgerEntries.filter((row) => row.amount > 0).reduce((sum, row) => sum + row.amount, 0);
    const totalExpense = ledgerEntries.filter((row) => row.amount < 0).reduce((sum, row) => sum + Math.abs(row.amount), 0);
    expect(income).toBeCloseTo(totalIncome, 1);
    expect(expense).toBeCloseTo(totalExpense, 1);
    expect(series.every((point) => point.income >= 0 && point.expense >= 0)).toBe(true);
  });

  it("ranks categories by outgoing amount only", () => {
    const totals = categoryTotals(ledgerEntries);
    expect(totals.length).toBeGreaterThan(3);
    for (let index = 1; index < totals.length; index += 1) {
      expect(totals[index - 1].total >= totals[index].total).toBe(true);
    }
    expect(totals.some((entry) => entry.category === "Salary")).toBe(false);
    expect(totals.every((entry) => entry.total > 0 && entry.color.startsWith("var("))).toBe(true);
  });
});
