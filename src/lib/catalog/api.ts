import { NextResponse } from "next/server";
import { demoCatalog, getCategory, getProduct } from "@/lib/demo/catalog";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog/types";

export const catalogCategories = ["website", "digital", "call", "mail", "generator"] as const;
export type CatalogApiProduct = CatalogProduct & { demo: true };
export function isDemoMode() {
  return process.env.DEMO_MODE === "true" ||
    (process.env.NODE_ENV === "development" && process.env.DEMO_MODE !== "false");
}
export function demoModeRequired() {
  return NextResponse.json({ error: "Demo API is disabled. Set DEMO_MODE=true to enable these mock contracts." }, { status: 404, headers: { "Cache-Control": "no-store" } });
}
export function publicProduct(product: CatalogProduct): CatalogApiProduct {
  return { ...product, demo: true };
}
export function catalogResponse(category?: string, slug?: string) {
  if (!isDemoMode()) return demoModeRequired();
  if (category && !catalogCategories.includes(category as CatalogCategory)) {
    return NextResponse.json({ error: "Unknown catalog category.", allowedCategories: catalogCategories }, { status: 404 });
  }
  if (category && slug) {
    const product = getProduct(category, slug);
    return product
      ? NextResponse.json({ product: publicProduct(product), demo: true }, { headers: { "Cache-Control": "no-store" } })
      : NextResponse.json({ error: "Catalog product not found." }, { status: 404 });
  }
  if (category) {
    const categoryInfo = getCategory(category);
    const products = demoCatalog.filter((product) => product.category === category).map(publicProduct);
    return NextResponse.json({ category: categoryInfo, products, count: products.length, demo: true }, { headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({
    categories: catalogCategories.map((id) => ({ id, name: id[0].toUpperCase() + id.slice(1), count: demoCatalog.filter((product) => product.category === id).length })),
    products: demoCatalog.map(publicProduct),
    count: demoCatalog.length,
    demo: true,
  }, { headers: { "Cache-Control": "no-store" } });
}
