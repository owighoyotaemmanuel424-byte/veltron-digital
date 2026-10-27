"use client";

import { Amount } from "@/components/shared/Amount";
import type { DemoDocument } from "@/lib/demo/documents";
import { AlertTriangle, BadgeCheck, Building2, CalendarDays, CopyCheck, FileText, Store } from "lucide-react";

const disclaimer = "Demo document — not a real receipt";

function dateText(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Demo date" : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ReceiptPreview({ document, className = "" }: { document: DemoDocument; className?: string }) {
  const isCrypto = document.variant === "crypto";
  const isBank = document.variant === "bank";
  const BrandIcon = isCrypto ? CopyCheck : isBank ? Building2 : Store;
  const currencyLabel = document.variant === "crypto" ? "Demo value (USD equivalent)" : "Total amount";
  return (
    <article className={`receipt-document mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white text-slate-900 shadow-xl ${className}`}>
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-9">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-slate-900 text-white"><BrandIcon className="size-5" aria-hidden="true" /></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Veltron Digital</p><h2 className="mt-1 text-xl font-bold tracking-tight">{isCrypto ? "Crypto Receipt" : isBank ? "Bank Payment Receipt" : "Store Receipt"}</h2></div>
          </div>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">Demo only</span>
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-900" role="note"><AlertTriangle className="size-4 shrink-0" />{disclaimer}</div>
      </div>
      <div className="space-y-6 px-6 py-6 sm:px-9 sm:py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-xs font-medium uppercase tracking-wider text-slate-500">{currencyLabel}</p><p className="mt-2 text-3xl font-bold tracking-tight"><Amount value={document.amount} currency="fiat" fiatCurrency="USD" className="text-3xl font-bold text-slate-900" /></p><p className="mt-2 text-sm text-slate-500">{document.merchant}</p></div>
          <div className="rounded-lg border border-slate-200 px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Document status</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700"><BadgeCheck className="size-4 text-amber-600" />{document.status === "Pending" ? "Pending (demo)" : "Simulated"}</p></div>
        </div>
        <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
          <div><p className="text-xs text-slate-500">Reference</p><p className="mt-1 break-all font-mono text-sm font-semibold">{document.reference}</p></div>
          <div><p className="text-xs text-slate-500">Date issued</p><p className="mt-1 flex items-center gap-2 text-sm font-medium"><CalendarDays className="size-4 text-slate-400" />{dateText(document.issuedAt)}</p></div>
          {isCrypto && <div className="sm:col-span-2"><p className="text-xs text-slate-500">Transaction hash placeholder</p><p className="mt-1 break-all font-mono text-xs font-semibold">{document.txHash || "DEMO-HASH-NOT-A-REAL-TRANSACTION"}</p><p className="mt-1 text-xs text-slate-500">This placeholder is not a blockchain transaction ID.</p></div>}
          {isBank && <div className="sm:col-span-2"><p className="text-xs text-slate-500">Transfer reference</p><p className="mt-1 font-mono text-sm font-semibold">DEMO-TRANSFER-NOT-A-REAL-PAYMENT</p></div>}
          <div className="sm:col-span-2"><p className="text-xs text-slate-500">Payment method</p><p className="mt-1 text-sm font-medium">{document.paymentMethod}</p></div>
        </div>
        {document.variant === "store" && <section><h3 className="text-sm font-bold">Items</h3><div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">{(document.items?.length ? document.items : [{ label: "Sample line item", amount: document.amount }]).map((item, index) => <div key={item.label + index} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="text-slate-600">{item.label}</span><Amount value={item.amount} currency="fiat" fiatCurrency="USD" className="font-semibold text-slate-900" /></div>)}</div><div className="flex justify-between gap-4 pt-3 text-sm font-bold"><span>Total (demo)</span><Amount value={document.amount} currency="fiat" fiatCurrency="USD" className="font-bold text-slate-900" /></div></section>}
        <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600"><div className="mb-1 flex items-center gap-2 font-semibold text-slate-800"><FileText className="size-4" />Demo record only</div>This document is generated for interface demonstration and testing. No funds were transferred, no bank account was accessed, and no crypto transaction occurred. Do not use it as proof of payment.</div>
      </div>
      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-xs font-semibold text-slate-600 sm:px-9">{disclaimer}</footer>
    </article>
  );
}
