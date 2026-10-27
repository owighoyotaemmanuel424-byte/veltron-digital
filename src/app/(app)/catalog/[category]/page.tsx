"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Clock3, ShieldCheck } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/catalog/CategoryCard";
import { ProductCard } from "@/components/catalog/ProductCard";
import { catalogCategories, demoCatalog, getCategory } from "@/lib/demo/catalog";

export default function CatalogCategoryPage() {
  const params = useParams<{ category: string }>();
  const category = getCategory(params.category);
  if (!category) notFound();
  const products = demoCatalog.filter((product) => product.category === category.id);
  return <div className="space-y-9">
    <Link href="/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" /> All products</Link>
    <div role="note" className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Demo mode:</strong> every product in this category is illustrative. Nothing is provisioned or fulfilled and no payment is collected.</div>\n    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand/10 via-card to-card p-6 sm:p-10"><div className="pointer-events-none absolute -right-10 -top-12 size-56 rounded-full bg-brand/10 blur-3xl" /><div className="relative max-w-3xl"><Badge variant="outline" className="border-brand/30 text-brand">{products.length} demo products</Badge><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{category.name}</h2><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{category.description}</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link href="#products">Explore products <ArrowRight className="size-4" /></Link></Button><span className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 text-brand" /> Demo checkout only</span></div></div></section>
    <section id="products"><div className="mb-5"><h2 className="text-xl font-semibold">Available products</h2><p className="mt-1 text-sm text-muted-foreground">Compare what is included and open any product for full details.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-7"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-widest text-brand">Simple by design</p><h2 className="mt-1 text-xl font-semibold">How it works</h2></div><div className="grid gap-5 sm:grid-cols-3">{category.howItWorks.map((step, index) => <div key={step} className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-sm font-bold text-brand">{index + 1}</span><div><h3 className="font-medium">{step}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{index === 0 ? "Browse the available options and select what fits." : index === 1 ? "Review product information and supply any requested details." : "Confirm the mock order and see it in My Products."}</p></div></div>)}</div></section>
    <section><div className="mb-4 flex items-center gap-2"><CircleHelp className="size-5 text-brand" /><h2 className="text-xl font-semibold">Quick answers</h2></div><div className="grid gap-3 md:grid-cols-2">{category.faqs.map((faq) => <article key={faq.question} className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">{faq.question}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p></article>)}</div></section>
    <section className="grid gap-3 sm:grid-cols-2">{catalogCategories.filter((item) => item.id !== category.id).slice(0,2).map((item) => <CategoryCard key={item.id} category={item.id} compact />)}</section>
    <p className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-5 text-muted-foreground"><Clock3 className="mt-0.5 size-4 shrink-0 text-amber-500" /> All listings are demo products. Availability, delivery times, and pricing are illustrative until live services are connected.</p>
  </div>;
}
