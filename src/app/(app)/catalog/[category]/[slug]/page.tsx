"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductIcon } from "@/components/catalog/ProductCard";
import { PurchaseDrawer } from "@/components/catalog/PurchaseDrawer";
import { catalogCategories, formatCatalogPrice, getProduct } from "@/lib/demo/catalog";

export default function CatalogProductPage() {
  const params = useParams<{ category: string; slug: string }>();
  const product = getProduct(params.category, params.slug);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  if (!product) notFound();
  const category = catalogCategories.find((item) => item.id === product.category)!;
  const fulfillment = product.fulfillment === "instant" ? { label: "Instant", description: "Available immediately in this demo", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: Sparkles } : product.fulfillment === "provisioned" ? { label: "Provisioned in 24h", description: "Estimated setup window for provisioned products", className: "bg-sky-500/10 text-sky-600 dark:text-sky-400", icon: Clock3 } : { label: "Manual review", description: "A team member would review requirements", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: MessageSquareText };
  const FulfillmentIcon = fulfillment.icon;
  return <div className="space-y-7">
    <Link href={`/catalog/${product.category}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" /> Back to {category.shortName}</Link>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-12">
      <section className="min-w-0 space-y-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start"><span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-brand/20 bg-brand/10 text-brand"><ProductIcon name={product.icon} className="size-8" /></span><div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{category.name}</Badge><Badge variant="outline" className={fulfillment.className}>{fulfillment.label}</Badge></div><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h2><p className="mt-2 text-lg text-muted-foreground">{product.tagline}</p></div></div>
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7"><h3 className="text-lg font-semibold">About this product</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{product.description}</p><div className="mt-6 rounded-xl bg-muted/50 p-4"><div className="flex items-center gap-2 text-sm font-medium"><FulfillmentIcon className="size-4 text-brand" /> {fulfillment.label}</div><p className="mt-1 pl-6 text-sm text-muted-foreground">{fulfillment.description}</p></div></div>
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7"><h3 className="text-lg font-semibold">What’s included</h3><ul className="mt-5 grid gap-4 sm:grid-cols-2">{product.features.map((feature) => <li key={feature} className="flex items-start gap-3 text-sm"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="size-3.5" /></span><span className="leading-6">{feature}</span></li>)}</ul></div>
        <div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" /><div><h3 className="font-semibold">Demo-mode notice</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">This is a sample catalog item. Buy now opens a simulated checkout that stores your selection in this browser. No payment is collected and no live service is activated.</p></div></div></div>
      </section>
      <aside className="lg:sticky lg:top-24"><div className="rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Product price</p><div className="mt-2 text-3xl font-semibold tracking-tight">{formatCatalogPrice(product)}</div><p className="mt-2 text-sm text-muted-foreground">{product.price.interval === "monthly" ? "Billed monthly in a future live integration." : product.price.interval === "usage" ? "Illustrative price per use." : "One-time illustrative price."}</p><div className="my-5 border-t border-border" /><div className="space-y-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Fulfillment</span><span className="font-medium">{fulfillment.label}</span></div><div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Category</span><span>{category.shortName}</span></div><div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Mode</span><span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400"><span className="size-1.5 rounded-full bg-amber-500" /> Demo</span></div></div><Button className="mt-6 w-full" size="lg" onClick={() => setPurchaseOpen(true)}>Buy now <ArrowRight className="size-4" /></Button>{product.fulfillment === "manual" && <Link href={`/support?subject=${encodeURIComponent(`Sales enquiry: ${product.name}`)}`} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-semibold transition-colors hover:bg-accent"><MessageSquareText className="size-4" /> Contact sales</Link>}<p className="mt-4 text-center text-xs leading-5 text-muted-foreground">Secure demo flow · No payment details required</p></div></aside>
    </div>
    <PurchaseDrawer product={product} open={purchaseOpen} onOpenChange={setPurchaseOpen} />
  </div>;
}
