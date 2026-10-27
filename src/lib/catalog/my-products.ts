import type { CatalogCategory, CatalogProduct } from "@/lib/catalog/types";

export type MyProductStatus = "Pending" | "Demo active" | "Awaiting manual review" | "Provisioning demo";
export type SavedCatalogProduct = {
  id: string;
  productId: string;
  name: string;
  category: CatalogCategory;
  slug: string;
  purchasedAt: string;
  configuration: Record<string, unknown>;
  status: MyProductStatus;
};

const storageKey = "veltron-my-products";
const updateEvent = "veltron:my-products-updated";

export function getMyProductsSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try { return window.localStorage.getItem(storageKey) ?? "[]"; } catch { return "[]"; }
}

export function getServerMyProductsSnapshot(): string {
  return "[]";
}

export function subscribeToMyProducts(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(updateEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(updateEvent, onStoreChange);
  };
}

export function parseMyProducts(snapshot: string): SavedCatalogProduct[] {
  try {
    const value: unknown = JSON.parse(snapshot);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is SavedCatalogProduct =>
      typeof item === "object" && item !== null &&
      typeof item.id === "string" && typeof item.productId === "string" &&
      typeof item.name === "string" && typeof item.category === "string" &&
      typeof item.slug === "string" && typeof item.purchasedAt === "string" &&
      typeof item.status === "string"
    );
  } catch {
    return [];
  }
}

export function addMyProduct(product: CatalogProduct, configuration: Record<string, unknown>): SavedCatalogProduct {
  if (typeof window === "undefined") throw new Error("Demo orders can only be saved in the browser.");
  const existing = parseMyProducts(getMyProductsSnapshot());
  const item: SavedCatalogProduct = {
    id: product.id + "-" + Date.now(),
    productId: product.id,
    name: product.name,
    category: product.category,
    slug: product.slug,
    purchasedAt: new Date().toISOString(),
    configuration,
    status: "Pending",
  };
  window.localStorage.setItem(storageKey, JSON.stringify([item, ...existing]));
  window.dispatchEvent(new Event(updateEvent));
  return item;
}
