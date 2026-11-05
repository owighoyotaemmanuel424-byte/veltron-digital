"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, Clock3, Download, ExternalLink, FileText, PackageCheck, Settings2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfigForm, type ConfigValues } from "@/components/catalog/ConfigForm";
import { ProductIcon } from "@/components/catalog/ProductCard";
import { ProductStatusPill } from "@/components/products/ProductStatusPill";
import { cancelMyProduct, getMyProductsSnapshot, getServerMyProductsSnapshot, parseMyProducts, subscribeToMyProducts, updateMyProduct } from "@/lib/catalog/my-products";
import { catalogCategories, demoCatalog, formatCatalogPrice } from "@/lib/demo/catalog";

function valueLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
function valueText(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(String).join(", ") || "—";
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ProductOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = decodeURIComponent(params.orderId);
  const snapshot = useSyncExternalStore(subscribeToMyProducts, getMyProductsSnapshot, getServerMyProductsSnapshot);
  const orders = useMemo(() => parseMyProducts(snapshot), [snapshot]);
  const order = orders.find((item) => item.id === orderId);
  const product = order ? demoCatalog.find((item) => item.id === order.productId || (item.category === order.category && item.slug === order.slug)) : undefined;
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<ConfigValues>({});
  const [saving, setSaving] = useState(false);

  if (!order) return <section className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center"><PackageCheck className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-semibold">Order not found</h2><p className="mt-2 text-sm text-muted-foreground">This demo order may have been cleared from this browser.</p><Button asChild className="mt-5"><Link href="/products">Back to My Products</Link></Button></section>;

  const cancel = () => {
    if (!window.confirm("Cancel this demo product? It will be marked Expired.")) return;
    cancelMyProduct(order.id);
    toast.success("Demo product cancelled", { description: order.name + " was marked Expired." });
  };
  const renew = () => {
    updateMyProduct(order.id, { status: "Pending", cancelledAt: undefined });
    toast.success("Renewal request created (demo)", { description: "The order is now Pending. No payment was taken." });
  };
  const downloadReceipt = () => {
    const lines = [
      "VELTRON DIGITAL — DEMO RECEIPT",
      "--------------------------------",
      "Order ID: " + order.id,
      "Product: " + order.name,
      "Category: " + (catalogCategories.find((item) => item.id === order.category)?.name ?? order.category),
      "Status: " + order.status,
      "Purchased: " + formatDate(order.purchasedAt),
      "Amount: " + (product ? formatCatalogPrice(product) : "Demo item — no charge"),
      "",
      "Configuration:",
      ...Object.entries(order.configuration).map(([key, value]) => valueLabel(key) + ": " + valueText(value)),
      "",
      "DEMO ONLY — no payment was collected and no live service was provisioned.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `veltron-receipt-${order.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Demo receipt downloaded");
  };
  const saveConfig = (next: ConfigValues) => {
    setSaving(true);
    try {
      updateMyProduct(order.id, { configuration: { ...order.configuration, ...next } });
      setEditing(false);
      toast.success("Configuration saved (demo)");
    } catch {
      toast.error("Could not save configuration");
    } finally { setSaving(false); }
  };
  const timeline = [
    { title: "Ordered", description: "Demo order created", done: true, icon: CheckCircle2 },
    { title: "In progress", description: order.status === "Pending" ? "Awaiting demo fulfillment" : order.status === "Expired" ? "Order cancelled in demo workspace" : "Demo fulfillment completed", done: order.status !== "Pending", current: order.status === "Pending", icon: Clock3 },
    { title: "Ready", description: order.status === "Active" ? "Demo product marked active" : order.status === "Expired" ? "No further fulfillment" : "Ready when the order is activated", done: order.status === "Active", icon: PackageCheck },
  ];

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="ghost" size="sm"><Link href="/products"><ArrowLeft className="size-4" /> My Products</Link></Button><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={downloadReceipt}><Download className="size-4" /> Download receipt</Button>{order.status === "Expired" ? <Button onClick={renew}>Renew (demo)</Button> : <Button variant="destructive" onClick={cancel}><XCircle className="size-4" /> Cancel</Button>}</div></div>
    <section className="rounded-3xl border border-border bg-gradient-to-br from-brand/10 via-card to-card p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand"><ProductIcon name={product?.icon ?? "LayoutGrid"} className="size-7" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-semibold tracking-tight">{order.name}</h2><ProductStatusPill status={order.status} /></div><p className="mt-2 text-sm text-muted-foreground">{catalogCategories.find((item) => item.id === order.category)?.name ?? order.category} · Order #{order.id}</p><p className="mt-4 text-2xl font-semibold">{product ? formatCatalogPrice(product) : "Demo order"}<span className="ml-2 text-sm font-normal text-muted-foreground">No live charge</span></p><p className="mt-2 text-xs text-muted-foreground">Purchased {formatDate(order.purchasedAt)}{order.cancelledAt ? " · Cancelled " + formatDate(order.cancelledAt) : ""}</p></div>{order.status !== "Expired" && <Button variant="outline" onClick={() => { setValues({ ...order.configuration }); setEditing((current) => !current); }}><Settings2 className="size-4" /> {editing ? "Close editor" : "Manage configuration"}</Button>}</div>
    </section>
    {editing && <section className="rounded-2xl border border-brand/30 bg-card p-5 sm:p-6"><div className="mb-5"><h3 className="text-lg font-semibold">Manage product configuration</h3><p className="mt-1 text-sm text-muted-foreground">Update the demo settings saved with this order. Changes remain in this browser only.</p></div><ConfigForm slug={order.slug} category={order.category} values={values} onChange={setValues} onValidSubmit={saveConfig} submitLabel={saving ? "Saving…" : "Save configuration"} /></section>}
    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">Order configuration</h3><p className="mt-1 text-sm text-muted-foreground">Read-only values saved with this order.</p></div><FileText className="size-5 text-muted-foreground" /></div>{Object.keys(order.configuration).length ? <dl className="mt-5 divide-y divide-border rounded-xl border border-border px-4">{Object.entries(order.configuration).map(([key, value]) => <div key={key} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-5"><dt className="text-sm text-muted-foreground">{valueLabel(key)}</dt><dd className="break-words text-sm font-medium sm:max-w-[62%] sm:text-right">{valueText(value)}</dd></div>)}</dl> : <p className="mt-5 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">No configuration values were recorded.</p>}</section>
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h3 className="text-lg font-semibold">Fulfillment timeline</h3><p className="mt-1 text-sm text-muted-foreground">Progress for this demo order.</p><ol className="mt-6 space-y-0">{timeline.map((step, index) => { const Icon = step.icon; return <li key={step.title} className="relative flex gap-3 pb-7 last:pb-0"><span className={"relative z-10 grid size-9 shrink-0 place-items-center rounded-full border " + (step.done ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : step.current ? "border-amber-500/30 bg-amber-500/10 text-amber-600" : "border-border bg-muted text-muted-foreground")}>{step.done ? <Check className="size-4" /> : <Icon className="size-4" />}</span>{index < timeline.length - 1 && <span className={"absolute left-[17px] top-9 h-[calc(100%-1.5rem)] w-px " + (step.done ? "bg-emerald-500/40" : "bg-border")} aria-hidden="true" />}<div className="pt-1"><p className="text-sm font-semibold">{step.title}{step.current && <span className="ml-2 text-xs font-medium text-amber-600">Current</span>}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{step.description}</p></div></li>; })}</ol><div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-muted-foreground">Demo mode: this timeline is illustrative. Veltron has not connected to an external fulfillment provider.</div></section>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Need another product? Explore the demo catalog.</p><Button asChild variant="outline"><Link href="/catalog">Browse catalog <ExternalLink className="size-4" /></Link></Button></div>
  </div>;
}
