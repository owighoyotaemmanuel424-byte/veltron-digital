"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, PackageOpen, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductIcon } from "@/components/catalog/ProductCard";
import { catalogCategories, formatCatalogPrice, demoCatalog } from "@/lib/demo/catalog";

type SavedProduct = { id: string; productId: string; name: string; category: string; slug: string; purchasedAt: string; configuration: Record<string, unknown>; status: "Pending" | "Demo active" | "Awaiting manual review" | "Provisioning demo" };

export default function MyProductsPage() {
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const refresh = () => {
    try { setProducts(JSON.parse(localStorage.getItem("veltron-my-products") ?? "[]") as SavedProduct[]); }
    catch { setProducts([]); }
    setLoaded(true);
  };
  useEffect(() => { refresh(); const onFocus = () => refresh(); window.addEventListener("focus", onFocus); return () => window.removeEventListener("focus", onFocus); }, []);
  return <div className="space-y-7">
    <section className="rounded-3xl border border-border bg-gradient-to-br from-brand/10 via-card to-card p-6 sm:p-9"><p className="text-xs font-semibold uppercase tracking-widest text-brand">Your workspace</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">My Products</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Products you have added through the demo checkout are saved in this browser. No real services or payments are activated.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link href="/catalog">Browse catalog <ArrowUpRight className="size-4" /></Link></Button><Button variant="outline" onClick={refresh}><RefreshCw className="size-4" /> Refresh</Button></div></section>
    {!loaded ? <div className="rounded-2xl border border-border p-10 text-center text-sm text-muted-foreground">Loading your products…</div> : products.length === 0 ? <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand"><PackageOpen className="size-7" /></span><h3 className="mt-4 text-lg font-semibold">Your products will appear here</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Explore the catalog and complete a mock checkout to add your first product to this list.</p><Button asChild className="mt-5"><Link href="/catalog">Explore products</Link></Button></div> : <section><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">Purchased in demo</h3><Badge variant="outline">{products.length} {products.length === 1 ? "item" : "items"}</Badge></div><div className="grid gap-4 lg:grid-cols-2">{products.map((saved) => { const product = demoCatalog.find((item) => item.id === saved.productId); const category = catalogCategories.find((item) => item.id === saved.category); return <article key={saved.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><ProductIcon name={product?.icon ?? "PackageOpen"} /></span><div className="min-w-0 flex-1"><h4 className="font-semibold">{saved.name}</h4><p className="mt-1 text-sm text-muted-foreground">{category?.shortName ?? saved.category} · {product ? formatCatalogPrice(product) : "Demo product"}</p></div><Badge variant="outline" className="max-w-40 text-right text-[10px]">{saved.status}</Badge></div><p className="mt-4 text-xs text-muted-foreground">Added {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(saved.purchasedAt))}</p><div className="mt-4 flex justify-end"><Button asChild variant="outline" size="sm"><Link href={`/catalog/${saved.category}/${saved.slug}`}>View details <ArrowUpRight className="size-3.5" /></Link></Button></div></article>; })}</div></section>}
  </div>;
}
