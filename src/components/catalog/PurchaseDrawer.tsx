"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, CreditCard, PackageCheck, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import type { CatalogProduct } from "@/lib/catalog/types";
import { formatCatalogPrice } from "@/lib/demo/catalog";
import { ProductIcon } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui/button";

type PurchaseConfigField = { key: string; label: string; placeholder: string; required?: boolean };
export const purchaseConfigSchema: Record<string, PurchaseConfigField[]> = {
  website: [{ key: "projectName", label: "Project or brand name", placeholder: "Your brand" }, { key: "websiteGoal", label: "Primary goal", placeholder: "e.g. showcase services" }],
  digital: [{ key: "usage", label: "Intended use", placeholder: "How will you use this tool?" }],
  call: [{ key: "teamSize", label: "Team size", placeholder: "e.g. 1–5 people" }, { key: "useCase", label: "Main use case", placeholder: "Describe your workflow" }],
  mail: [{ key: "audience", label: "Audience or list size", placeholder: "e.g. 500 contacts" }, { key: "goal", label: "Campaign goal", placeholder: "What are you trying to achieve?" }],
  generator: [{ key: "outputType", label: "What do you want to create?", placeholder: "Describe the intended output" }],
};

const storageKey = "veltron-my-products";
type SavedProduct = { id: string; productId: string; name: string; category: string; slug: string; purchasedAt: string; configuration: Record<string, string>; status: "Demo active" | "Awaiting manual review" | "Provisioning demo" };
function saveMyProduct(product: CatalogProduct, configuration: Record<string, string>) {
  let existing: SavedProduct[] = [];
  try { existing = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as SavedProduct[]; } catch { existing = []; }
  const item: SavedProduct = { id: `${product.id}-${Date.now()}`, productId: product.id, name: product.name, category: product.category, slug: product.slug, purchasedAt: new Date().toISOString(), configuration, status: product.fulfillment === "manual" ? "Awaiting manual review" : product.fulfillment === "provisioned" ? "Provisioning demo" : "Demo active" };
  localStorage.setItem(storageKey, JSON.stringify([item, ...existing]));
}

export function PurchaseDrawer({ product, open, onOpenChange }: { product: CatalogProduct; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [configuration, setConfiguration] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  const fields = purchaseConfigSchema[product.category] ?? [];
  const close = () => { onOpenChange(false); setStep(0); setBusy(false); };
  const submit = () => {
    setBusy(true);
    window.setTimeout(() => {
      try { saveMyProduct(product, configuration); toast.success(`${product.name} added to My Products`, { description: "Demo checkout complete. No payment was taken." }); close(); }
      catch { toast.error("Could not save this demo order. Please try again."); }
      finally { setBusy(false); }
    }, 450);
  };
  return <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="purchase-title" className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-border bg-background shadow-2xl">
      <header className="flex items-start justify-between border-b border-border p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand">Demo checkout</p><h2 id="purchase-title" className="mt-1 text-xl font-semibold">{step === 0 ? "Configure your product" : step === 1 ? "Review your order" : "Mock checkout"}</h2><p className="mt-1 text-sm text-muted-foreground">Step {step + 1} of 3 · No real payment is collected</p></div><button type="button" onClick={close} className="rounded-lg p-2 text-muted-foreground hover:bg-accent" aria-label="Close purchase drawer"><X className="size-5" /></button></header>
      <div className="flex gap-2 px-5 pt-5 sm:px-6" aria-label="Checkout progress">{[0,1,2].map((number) => <div key={number} className={`h-1.5 flex-1 rounded-full ${number <= step ? "bg-brand" : "bg-muted"}`} />)}</div>
      <div className="flex-1 space-y-6 p-5 sm:p-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"><span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand"><ProductIcon name={product.icon} /></span><div className="min-w-0 flex-1"><p className="font-semibold">{product.name}</p><p className="text-sm text-muted-foreground">{product.tagline}</p></div><p className="shrink-0 text-sm font-semibold">{formatCatalogPrice(product)}</p></div>
        {step === 0 && <div className="space-y-4"><div><h3 className="font-semibold">A few details</h3><p className="mt-1 text-sm text-muted-foreground">These details are saved locally for this demo only.</p></div>{fields.map((field) => <label key={field.key} className="block space-y-1.5 text-sm font-medium">{field.label}<input value={configuration[field.key] ?? ""} onChange={(event) => setConfiguration((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>)}<p className="rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">Demo mode: no provider is contacted and no real service is activated.</p></div>}
        {step === 1 && <div className="space-y-4"><div><h3 className="font-semibold">Order summary</h3><p className="mt-1 text-sm text-muted-foreground">Check your selection before mock checkout.</p></div><div className="space-y-3 rounded-xl border border-border p-4"><div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">Product</span><span className="text-right font-medium">{product.name}</span></div><div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">Fulfillment</span><span>{product.fulfillment === "instant" ? "Instant" : product.fulfillment === "provisioned" ? "Provisioned in 24h" : "Manual review"}</span></div>{Object.entries(configuration).filter(([, value]) => value.trim()).map(([key, value]) => <div key={key} className="flex justify-between gap-4 text-sm"><span className="capitalize text-muted-foreground">{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</span><span className="max-w-[60%] text-right">{value}</span></div>)}<div className="flex justify-between border-t border-border pt-3 font-semibold"><span>Total (demo)</span><span>{formatCatalogPrice(product)}</span></div></div></div>}
        {step === 2 && <div className="space-y-5 text-center"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand/10 text-brand"><CreditCard className="size-7" /></span><div><h3 className="text-lg font-semibold">Ready to complete the demo?</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Selecting Complete demo order saves this product to My Products in this browser. No card details or real payment are needed.</p></div><div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-left"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-500" /><p className="text-xs leading-5 text-muted-foreground">This is a simulated checkout, not a live purchase or service activation.</p></div></div>}
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-border p-5 sm:p-6">{step === 0 ? <Button variant="outline" onClick={close}>Cancel</Button> : <Button variant="outline" onClick={() => setStep((step - 1) as 0 | 1 | 2)}><ChevronLeft className="size-4" /> Back</Button>}{step < 2 ? <Button onClick={() => setStep((step + 1) as 1 | 2)}>{step === 0 ? "Review order" : "Continue to checkout"} <ChevronRight className="size-4" /></Button> : <Button onClick={submit} disabled={busy}>{busy ? "Saving demo order…" : <><Check className="size-4" /> Complete demo order</>}</Button>}</footer>
    </section>
  </div>;
}
