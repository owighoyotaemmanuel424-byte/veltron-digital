"use client";

import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, FileText, Globe, Mail, PanelsTopLeft, PhoneCall, Smartphone, WandSparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CatalogCategory } from "@/lib/catalog/types";
import { catalogCategories, demoCatalog } from "@/lib/demo/catalog";

const icons: Record<string, LucideIcon> = { Globe, PanelsTopLeft, PhoneCall, Mail, WandSparkles, Smartphone, FileText, BriefcaseBusiness };
export function CategoryCard({ category, compact = false }: { category: CatalogCategory; compact?: boolean }) {
  const item = catalogCategories.find((entry) => entry.id === category)!;
  const Icon = icons[item.icon] ?? Smartphone;
  const count = demoCatalog.filter((product) => product.category === category).length;
  return <Link href={`/catalog/${category}`} className={`group relative flex overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${item.accent} from-card to-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${compact ? "min-h-36" : "min-h-48 flex-col justify-between"}`}>
    <div className="flex items-start justify-between gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl border border-border/70 bg-background/70 text-brand"><Icon className="size-6" /></span><span className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground">{count} products</span></div>
    <div className={compact ? "mt-4" : "mt-8"}><h3 className="text-lg font-semibold tracking-tight">{item.name}</h3><p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{item.description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">Explore category <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span></div>
  </Link>;
}
