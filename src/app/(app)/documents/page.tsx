"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowUpRight, FileText, Printer, ReceiptText, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReceiptPreview } from "@/components/documents/ReceiptPreview";
import { getMyProductsSnapshot, getServerMyProductsSnapshot, parseMyProducts, subscribeToMyProducts } from "@/lib/catalog/my-products";
import { demoDocuments, documentForGeneratorOrder, type DemoDocument } from "@/lib/demo/documents";

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Demo date" : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}
function downloadText(document: DemoDocument) {
  const lines = [
    "VELTRON DIGITAL — DEMO DOCUMENT",
    "DEMO DOCUMENT — NOT A REAL RECEIPT",
    "----------------------------------",
    "Type: " + document.variant,
    "Title: " + document.title,
    "Merchant: " + document.merchant,
    "Amount: " + document.amount.toFixed(2) + " " + document.currency,
    "Reference: " + document.reference,
    ...(document.txHash ? ["Transaction hash placeholder: " + document.txHash] : []),
    "Date: " + dateLabel(document.issuedAt),
    "Payment method: " + document.paymentMethod,
    "Status: " + document.status + " (demo)",
    "",
    "No funds were transferred. This file is for demonstration only and is not proof of payment.",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `veltron-demo-${document.variant}-${document.id}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  toast.success("Demo document downloaded");
}

export default function DocumentsPage() {
  const snapshot = useSyncExternalStore(subscribeToMyProducts, getMyProductsSnapshot, getServerMyProductsSnapshot);
  const orders = useMemo(() => parseMyProducts(snapshot), [snapshot]);
  const documents = useMemo(() => {
    const generated = orders.filter((order) => order.category === "generator").map(documentForGeneratorOrder);
    const all = [...generated, ...demoDocuments];
    return all.filter((document, index) => all.findIndex((candidate) => candidate.id === document.id) === index);
  }, [orders]);
  const [selected, setSelected] = useState<DemoDocument | null>(null);
  const [search, setSearch] = useState("");
  const filtered = documents.filter((document) => (document.title + " " + document.reference + " " + document.merchant).toLowerCase().includes(search.toLowerCase()));

  return <div className="space-y-7">
    <style jsx global>{`
      @media print {
        body { background: #fff !important; color: #111827 !important; }
        body * { visibility: hidden !important; }
        .receipt-document, .receipt-document * { visibility: visible !important; }
        .receipt-document { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: none !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        .receipt-document footer, .receipt-document [role="note"] { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        aside, header, nav, button, [data-radix-portal] { display: none !important; }
        @page { margin: 12mm; size: auto; }
      }
    `}</style>
    <section className="flex flex-col justify-between gap-4 rounded-3xl border border-border bg-gradient-to-br from-brand/10 via-card to-card p-6 sm:flex-row sm:items-end sm:p-8">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-brand">Generator Tools</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Documents & receipts</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Preview demo receipt layouts, print them from your browser, or download a plain-text copy.</p></div>
      <span className="inline-flex items-center gap-2 self-start rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 sm:self-auto"><AlertTriangle className="size-4" />Demo documents only</span>
    </section>
    <div role="note" className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" /><p className="leading-6 text-muted-foreground"><strong className="text-foreground">Every preview is marked as a demo.</strong> References, transaction hashes, merchants, and amounts are fictional placeholders. No real bank, wallet, or payment information is loaded or generated.</p></div>
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">Generated documents</h3><p className="mt-1 text-xs text-muted-foreground">{filtered.length} demo document{filtered.length === 1 ? "" : "s"}</p></div><label className="relative sm:w-72"><span className="sr-only">Search documents</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label></div>
      {filtered.length ? <div className="divide-y divide-border">{filtered.map((document) => <article key={document.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex min-w-0 items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><ReceiptText className="size-5" /></span><div className="min-w-0"><h4 className="font-medium">{document.title}</h4><p className="mt-1 text-sm text-muted-foreground">{document.variant.charAt(0).toUpperCase() + document.variant.slice(1)} variant · {dateLabel(document.issuedAt)}</p><p className="mt-1 truncate font-mono text-xs text-muted-foreground">{document.reference}</p><p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">Demo document — not a real receipt</p></div></div><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => setSelected(document)}>Preview <ArrowUpRight className="size-4" /></Button><Button variant="ghost" size="sm" onClick={() => downloadText(document)} aria-label={`Download ${document.title} as text`}><ArrowDownToLine className="size-4" /> <span className="hidden sm:inline">Text</span></Button></div></article>)}</div> : <div className="p-10 text-center"><FileText className="mx-auto size-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">No matching documents</h3><p className="mt-1 text-sm text-muted-foreground">Try another search term.</p></div>}
    </section>
    <p className="text-xs leading-5 text-muted-foreground">Printing uses your browser’s print dialog. Choose “Save as PDF” to create a PDF file. These generated files are visual examples, not financial records.</p>
    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-border bg-background p-3 sm:p-6">
        <DialogHeader className="px-2 pt-2 print:hidden"><DialogTitle>{selected?.title ?? "Receipt preview"}</DialogTitle><DialogDescription>Preview a fictional document. The demo disclaimer is included in the receipt and printed copy.</DialogDescription></DialogHeader>
        {selected && <div id="receipt-print-target" className="space-y-4"><div className="flex flex-wrap justify-end gap-2 px-2 print:hidden"><Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Print / Save PDF</Button><Button onClick={() => downloadText(selected)}><ArrowDownToLine className="size-4" /> Download text</Button></div><ReceiptPreview document={selected} /></div>}
      </DialogContent>
    </Dialog>
  </div>;
}
