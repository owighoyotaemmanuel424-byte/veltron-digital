"use client";

import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, BarChart3, CheckCircle2, Contact, Database, FileCheck, FileText, Globe, Headphones, Image as ImageIcon, Lightbulb, Mail, MessagesSquare, Mic, Newspaper, Palette, LayoutGrid, PhoneCall, QrCode, Receipt, Search, Send, ShieldCheck, ShoppingBag, Smartphone, Users, WandSparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog/types";
import { catalogCategories, formatCatalogPrice } from "@/lib/demo/catalog";
import { Badge } from "@/components/ui/badge";

const icons: Record<string, LucideIcon> = { Globe, LayoutGrid, BriefcaseBusiness, ShoppingBag, ShieldCheck, FileText, QrCode, Image: ImageIcon, CalendarDays, Database, PhoneCall, Headphones, Mic, BarChart3, Contact, MessagesSquare, Mail, Newspaper, Users, Send, Lightbulb, WandSparkles, Receipt, FileCheck, Search, Palette, Smartphone, CheckCircle2 };

export function ProductIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Smartphone;
  return <Icon className={className} aria-hidden="true" />;
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const category = catalogCategories.find((item) => item.id === product.category);
  return <article className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-black/10 motion-reduce:transform-none">
    <div className="flex items-start justify-between gap-3">
      <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand"><ProductIcon name={product.icon} className="size-5" /></span>
      <Badge variant="outline" className="max-w-[60%] truncate text-[10px]">{category?.shortName ?? product.category}</Badge>
    </div>
    <h3 className="mt-4 text-base font-semibold tracking-tight">{product.name}</h3>
    <p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">{product.tagline}</p>
    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
      <span className="text-sm font-semibold">{formatCatalogPrice(product)}</span>
      <Link href={`/catalog/${product.category}/${product.slug}`} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View <ArrowUpRight className="size-3.5" /></Link>
    </div>
  </article>;
}
