import type { CatalogCategory, CatalogProduct } from "@/lib/catalog/types";
import { demoMyProducts } from "@/lib/demo/myProducts";

export type MyProductStatus = "Active" | "Pending" | "Expired";
export type SavedCatalogProduct = {
  id: string;
  productId: string;
  name: string;
  category: CatalogCategory;
  slug: string;
  purchasedAt: string;
  configuration: Record<string, unknown>;
  status: MyProductStatus;
  cancelledAt?: string;
};

const storageKey = "veltron-my-products";
const updateEvent = "veltron:my-products-updated";

function notifyUpdate() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(updateEvent));
}

export function getMyProductsSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored !== null) return stored;
    window.localStorage.setItem(storageKey, JSON.stringify(demoMyProducts));
    return JSON.stringify(demoMyProducts);
  } catch { return JSON.stringify(demoMyProducts); }
}

export function getServerMyProductsSnapshot(): string { return "[]"; }

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
  } catch { return []; }
}

function save(items: SavedCatalogProduct[]) {
  if (typeof window === "undefined") throw new Error("Demo orders can only be changed in the browser.");
  window.localStorage.setItem(storageKey, JSON.stringify(items));
  notifyUpdate();
}

export function addMyProduct(product: CatalogProduct, configuration: Record<string, unknown>): SavedCatalogProduct {
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
  save([item, ...existing]);
  return item;
}

export function updateMyProduct(orderId: string, patch: Partial<Pick<SavedCatalogProduct, "configuration" | "status" | "cancelledAt">>): SavedCatalogProduct | undefined {
  const items = parseMyProducts(getMyProductsSnapshot());
  let updated: SavedCatalogProduct | undefined;
  save(items.map((item) => {
    if (item.id !== orderId) return item;
    updated = { ...item, ...patch };
    return updated;
  }));
  return updated;
}

export function cancelMyProduct(orderId: string): boolean {
  const items = parseMyProducts(getMyProductsSnapshot());
  const exists = items.some((item) => item.id === orderId);
  if (!exists) return false;
  save(items.map((item) => item.id === orderId ? { ...item, status: "Expired" as const, cancelledAt: new Date().toISOString() } : item));
  return true;
}

export function duplicateMyProduct(orderId: string): SavedCatalogProduct | undefined {
  const items = parseMyProducts(getMyProductsSnapshot());
  const original = items.find((item) => item.id === orderId);
  if (!original) return undefined;
  const copy: SavedCatalogProduct = { ...original, id: original.id + "-copy-" + Date.now(), purchasedAt: new Date().toISOString(), status: "Pending", cancelledAt: undefined, configuration: { ...original.configuration } };
  save([copy, ...items]);
  return copy;
}
