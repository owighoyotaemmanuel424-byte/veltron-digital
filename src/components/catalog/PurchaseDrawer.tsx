"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, CreditCard, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import type { CatalogProduct } from "@/lib/catalog/types";
import { formatCatalogPrice } from "@/lib/demo/catalog";
import { ProductIcon } from "@/components/catalog/ProductCard";
import { ConfigForm, type ConfigValues } from "@/components/catalog/ConfigForm";
import { Button } from "@/components/ui/button";
import { getConfigFields } from "@/lib/catalog/schemas";
import { addMyProduct } from "@/lib/catalog/my-products";

function displayValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
function displayLabel(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

export function PurchaseDrawer({ product, open, onOpenChange }: { product: CatalogProduct; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [configuration, setConfiguration] = useState<ConfigValues>({});
  const [busy, setBusy] = useState(false);
  const fields = getConfigFields(product.slug, product.category);

  if (!open) return null;
  const close = () => { onOpenChange(false); setStep(0); setConfiguration({}); setBusy(false); };
  const submit = () => {
    setBusy(true);
    try {
      addMyProduct(product, configuration);
      toast.success("Order created (demo)", { description: product.name + " was added to My Products with Pending status. No payment was taken." });
      close();
    } catch {
      toast.error("Could not save this demo order. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="purchase-title" className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-border bg-background shadow-2xl">
      <header className="flex items-start justify-between border-b border-border p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand">Demo checkout</p><h2 id="purchase-title" className="mt-1 text-xl font-semibold">{step === 0 ? "Configure your product" : step === 1 ? "Review your order" : "Confirm demo order"}</h2><p className="mt-1 text-sm text-muted-foreground">Step {step + 1} of 3 · No real payment is collected</p></div><button type="button" onClick={close} className="rounded-lg p-2 text-muted-foreground hover:bg-accent" aria-label="Close purchase drawer"><X className="size-5" /></button></header>
      <div className="flex gap-2 px-5 pt-5 sm:px-6" aria-label="Checkout progress">{[0, 1, 2].map((number) => <div key={number} className={"h-1.5 flex-1 rounded-full " + (number <= step ? "bg-brand" : "bg-muted")} />)}</div>
      <div className="flex-1 space-y-6 p-5 sm:p-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"><span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand"><ProductIcon name={product.icon} /></span><div className="min-w-0 flex-1"><p className="font-semibold">{product.name}</p><p className="text-sm text-muted-foreground">{product.tagline}</p></div><p className="shrink-0 text-sm font-semibold">{formatCatalogPrice(product)}</p></div>
        {step === 0 && <ConfigForm slug={product.slug} category={product.category} values={configuration} onChange={setConfiguration} onValidSubmit={(values) => { setConfiguration(values); setStep(1); }} />}
        {step === 1 && <div className="space-y-5"><div><h3 className="font-semibold">Review your configuration</h3><p className="mt-1 text-sm text-muted-foreground">Check the details before continuing. You can go back to edit them.</p></div><div className="divide-y divide-border rounded-xl border border-border bg-card px-4">{fields.map((item) => <div key={item.name} className="flex items-start justify-between gap-4 py-3 text-sm"><span className="shrink-0 text-muted-foreground">{item.label}</span><span className="max-w-[62%] break-words text-right font-medium">{displayValue(configuration[item.name])}</span></div>)}<div className="flex items-center justify-between gap-4 py-3 text-sm"><span className="text-muted-foreground">Fulfillment</span><span>{product.fulfillment === "instant" ? "Instant" : product.fulfillment === "provisioned" ? "Provisioned in 24h" : "Manual review"}</span></div><div className="flex items-center justify-between gap-4 py-3 font-semibold"><span>Total (demo)</span><span>{formatCatalogPrice(product)}</span></div></div><p className="rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">Please review the values above. Submission creates a local demo order with Pending status; no real service is provisioned.</p></div>}
        {step === 2 && <div className="space-y-5 text-center"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand/10 text-brand"><CreditCard className="size-7" /></span><div><h3 className="text-lg font-semibold">Ready to create your demo order?</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Completing this step saves your product configuration in My Products with Pending status. No payment details or real payment are required.</p></div><div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-left"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-500" /><p className="text-xs leading-5 text-muted-foreground">Demo only. Nothing is sent to a provider. File fields store only the selected filename and do not upload file contents.</p></div><div className="rounded-xl border border-border bg-card p-4 text-left"><p className="text-sm font-semibold">{product.name}</p><p className="mt-1 text-sm text-muted-foreground">{formatCatalogPrice(product)} · Pending</p><p className="mt-2 text-xs text-muted-foreground">{Object.keys(configuration).length} configuration fields reviewed</p></div></div>}
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-border p-5 sm:p-6">{step === 0 ? <Button variant="outline" onClick={close}>Cancel</Button> : <Button variant="outline" onClick={() => setStep((step - 1) as 0 | 1 | 2)}><ChevronLeft className="size-4" /> Back</Button>}{step === 1 ? <Button onClick={() => setStep(2)}>Continue <ChevronRight className="size-4" /></Button> : step === 2 ? <Button onClick={submit} disabled={busy}>{busy ? "Saving demo order…" : <><Check className="size-4" /> Create demo order</>}</Button> : <span className="text-xs text-muted-foreground">Complete required fields to continue</span>}</footer>
    </section>
  </div>;
}
