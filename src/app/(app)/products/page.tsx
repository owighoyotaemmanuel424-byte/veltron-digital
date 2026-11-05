"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Copy, Ellipsis, ExternalLink, PackageOpen, Search, Settings2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductIcon } from "@/components/catalog/ProductCard";
import { ProductStatusPill } from "@/components/products/ProductStatusPill";
import { catalogCategories, demoCatalog, formatCatalogPrice } from "@/lib/demo/catalog";
import { cancelMyProduct, duplicateMyProduct, getMyProductsSnapshot, getServerMyProductsSnapshot, parseMyProducts, subscribeToMyProducts } from "@/lib/catalog/my-products";
import type { CatalogCategory } from "@/lib/catalog/types";

const categoryNames: Record<CatalogCategory, string> = { website: "Website Creator", digital: "Digital Tools", call: "Call Tools", mail: "Mailing Tools", generator: "Generator Tools" };
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export default function ProductsPage() {
  const snapshot = useSyncExternalStore(subscribeToMyProducts, getMyProductsSnapshot, getServerMyProductsSnapshot);
  const orders = useMemo(() => parseMyProducts(snapshot), [snapshot]);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = orders.filter((order) =>
    (category === "all" || order.category === category) &&
    (status === "all" || order.status === status) &&
    (order.name + " " + order.id).toLowerCase().includes(search.toLowerCase())
  );

  const cancel = (id: string, name: string) => {
    if (!window.confirm(`Cancel "${name}"? This demo order will be marked Expired.`)) return;
    cancelMyProduct(id);
    toast.success("Demo product cancelled", { description: name + " was marked Expired." });
  };
  const duplicate = (id: string, name: string) => {
    const copy = duplicateMyProduct(id);
    if (copy) toast.success("Demo product duplicated", { description: name + " was copied as a new pending order." });
  };

  return <div className="space-y-7">
    <section className="flex flex-col justify-between gap-4 rounded-3xl border border-border bg-gradient-to-br from-brand/10 via-card to-card p-6 sm:flex-row sm:items-end sm:p-8">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-brand">Workspace inventory</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">My Products</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Manage demo orders, review configuration, and check product status in one place.</p></div>
      <Button asChild><Link href="/catalog">Browse catalog <ArrowUpRight className="size-4" /></Link></Button>
    </section>
    <section className="grid gap-3 sm:grid-cols-3">
      {[{ label: "Total products", value: orders.length }, { label: "Active", value: orders.filter((item) => item.status === "Active").length }, { label: "Pending", value: orders.filter((item) => item.status === "Pending").length }].map((stat) => <div key={stat.label} className="rounded-2xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">{stat.label}</p><p className="mt-2 text-2xl font-semibold">{stat.value}</p></div>)}
    </section>
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-semibold">Purchased products</h3><p className="mt-1 text-xs text-muted-foreground">{filtered.length} of {orders.length} orders</p></div>
        <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_160px_160px]">
          <label className="relative"><span className="sr-only">Search products</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <label><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">All categories</option>{catalogCategories.map((item) => <option key={item.id} value={item.id}>{item.shortName}</option>)}</select></label>
          <label><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">All statuses</option><option value="Active">Active</option><option value="Pending">Pending</option><option value="Expired">Expired</option></select></label>
        </div>
      </div>
      {filtered.length === 0 ? <div className="px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground"><PackageOpen className="size-6" /></span><h3 className="mt-4 font-semibold">{orders.length ? "No products match these filters" : "No products yet"}</h3><p className="mt-2 text-sm text-muted-foreground">{orders.length ? "Try changing the category, status, or search." : "Browse the catalog and place a demo order to get started."}</p>{orders.length ? <Button variant="outline" className="mt-4" onClick={() => { setCategory("all"); setStatus("all"); setSearch(""); }}>Clear filters</Button> : <Button asChild className="mt-4"><Link href="/catalog">Explore catalog</Link></Button>}</div> :
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Purchased</th><th className="px-4 py-3 font-medium">Next action</th><th className="px-4 py-3 font-medium"><span className="sr-only">Menu</span></th></tr></thead><tbody className="divide-y divide-border">{filtered.map((order) => { const product = demoCatalog.find((item) => item.id === order.productId || (item.category === order.category && item.slug === order.slug)); const next = order.status === "Active" ? "Manage" : order.status === "Expired" ? "Renew" : "Details"; return <tr key={order.id} className="transition-colors hover:bg-muted/20"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><ProductIcon name={product?.icon ?? "LayoutGrid"} /></span><div><p className="font-medium">{order.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{product ? formatCatalogPrice(product) : "Demo product"} · #{order.id.slice(-8)}</p></div></div></td><td className="px-4 py-4 text-muted-foreground">{categoryNames[order.category]}</td><td className="px-4 py-4"><ProductStatusPill status={order.status} /></td><td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{dateLabel(order.purchasedAt)}</td><td className="px-4 py-4"><Button asChild variant={order.status === "Active" ? "default" : "outline"} size="sm"><Link href={`/products/${encodeURIComponent(order.id)}`}>{next}{order.status === "Expired" ? <ArrowUpRight className="size-3.5" /> : <ExternalLink className="size-3.5" />}</Link></Button></td><td className="px-4 py-4"><details className="relative"><summary aria-label={`Actions for ${order.name}`} className="grid size-9 cursor-pointer list-none place-items-center rounded-lg hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Ellipsis className="size-4" /></summary><div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-border bg-popover p-1.5 shadow-xl"><Link href={`/products/${encodeURIComponent(order.id)}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"><Settings2 className="size-4" />Details / manage</Link><button type="button" onClick={() => duplicate(order.id, order.name)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"><Copy className="size-4" />Duplicate</button><button type="button" onClick={() => cancel(order.id, order.name)} disabled={order.status === "Expired"} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-accent disabled:opacity-40"><XCircle className="size-4" />Cancel demo</button></div></details></td></tr>; })}</tbody></table></div>}
    </section>
    <p className="text-xs leading-5 text-muted-foreground">Demo workspace only. Status changes and orders are stored in this browser; no live services, renewals, or payments are processed.</p>
  </div>;
}
