"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/catalog/CategoryCard";
import { ProductCard } from "@/components/catalog/ProductCard";
import { catalogCategories, demoCatalog } from "@/lib/demo/catalog";
import type { CatalogCategory } from "@/lib/catalog/types";

export default function CatalogPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CatalogCategory | "all">("all");
  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => demoCatalog.filter((product) => (category === "all" || product.category === category) && (!normalized || [product.name, product.tagline, product.description, product.category, ...product.features].join(" ").toLowerCase().includes(normalized))), [category, normalized]);
  const searching = normalized.length > 0 || category !== "all";
  return <div className="space-y-10">
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand/15 via-card to-card p-6 sm:p-9 lg:p-11">
      <div className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand"><Sparkles className="size-3.5" /> Veltron marketplace · Demo catalog</span><h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Tools to move your ideas forward.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Explore practical tools across five categories. Compare features, review pricing, and try the simulated purchase flow.</p></div>
      <div className="relative mt-7 flex max-w-2xl flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, features, or categories…" aria-label="Search all products" className="h-12 bg-background/80 pl-10 pr-10" />{query && <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Clear search"><X className="size-4" /></button>}</div><Button variant="outline" className="h-12" asChild><Link href="/my-products">My Products</Link></Button><Button variant="outline" className="h-12" onClick={() => { setQuery(""); setCategory("all"); }}>Reset filters</Button></div>
      <div className="relative mt-4 flex flex-wrap gap-2" aria-label="Filter by category"><button type="button" onClick={() => setCategory("all")} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${category === "all" ? "border-brand bg-brand text-brand-fg" : "border-border bg-background/70 text-muted-foreground hover:text-foreground"}`}>All categories</button>{catalogCategories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} aria-pressed={category === item.id} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${category === item.id ? "border-brand bg-brand text-brand-fg" : "border-border bg-background/70 text-muted-foreground hover:text-foreground"}`}>{item.shortName}</button>)}</div>
    </section>
    {searching ? <section><div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Search results</h2><p className="mt-1 text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "product" : "products"} found</p></div><Button variant="ghost" size="sm" onClick={() => { setQuery(""); setCategory("all"); }}>Clear</Button></div>{filtered.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-2xl border border-dashed border-border p-10 text-center"><Search className="mx-auto size-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">No products found</h3><p className="mt-1 text-sm text-muted-foreground">Try another keyword or clear your filters.</p></div>}</section> : <>
      <section><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand">Browse by category</p><h2 className="mt-1 text-xl font-semibold">Find the right toolkit</h2></div><span className="text-sm text-muted-foreground">5 categories</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{catalogCategories.map((item) => <CategoryCard key={item.id} category={item.id} compact />)}</div></section>
      {catalogCategories.map((item) => { const products = demoCatalog.filter((product) => product.category === item.id); return <section key={item.id}><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand">{products.length} products</p><h2 className="mt-1 text-xl font-semibold">{item.name}</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{item.description}</p></div><Link href={`/catalog/${item.id}`} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline">View all <ArrowRight className="size-4" /></Link></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.slice(0,3).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>; })}
    </>}
    <p className="rounded-xl border border-border bg-card/60 p-4 text-xs leading-5 text-muted-foreground">Demo mode is enabled. Prices and product details are illustrative; checkout does not charge you or activate live services.</p>
  </div>;
}
