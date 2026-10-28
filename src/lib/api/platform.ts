import { catalogProducts, type CatalogCategory, type CatalogProduct, type CatalogTier } from "@/lib/demo/catalog";

/**
 * Typed client for the platform API (`services/platform`).
 *
 * The catalog is public, so it can be fetched during server rendering. When the
 * API is not configured or is unreachable the caller transparently receives the
 * demo catalog instead — the UI never renders an error page because a backing
 * service is down, and the source of the data is reported alongside it.
 */

export type ApiProduct = {
  id: string;
  name: string;
  category: string;
  description?: string;
  feeRate: string | number;
  apyRate: string | number;
  isActive: boolean;
};

export type CatalogSource = "live" | "demo";
export type CatalogResult = { products: CatalogProduct[]; source: CatalogSource };

const CATEGORY_MAP: Record<string, CatalogCategory> = {
  BUSINESS_SUITE: "GLOBAL_BUSINESS",
  GLOBAL_BUSINESS: "GLOBAL_BUSINESS",
  CRYPTO_PAIR: "CRYPTO_EXCHANGE",
  CRYPTO_EXCHANGE: "CRYPTO_EXCHANGE",
  SAVINGS_VAULT: "SAVINGS_VAULT",
  YIELD_VAULT: "SAVINGS_VAULT",
  ANALYTICS_PRO: "ANALYTICS_PRO",
};

const asNumber = (value: string | number): number => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function tierFor(product: ApiProduct): CatalogTier {
  const feeRate = asNumber(product.feeRate);
  const apy = asNumber(product.apyRate);
  return {
    name: "Standard",
    priceMonthly: 0,
    apy: apy > 0 ? apy : null,
    feeRate,
    limits: "Contact sales",
  };
}

/** Maps one API row onto the catalog card model, or null for unknown categories. */
export function normalizeProduct(input: ApiProduct): CatalogProduct | null {
  const category = CATEGORY_MAP[input.category?.toUpperCase?.() ?? ""];
  if (!category || !input.name) return null;
  const feeRate = asNumber(input.feeRate);
  const apyRate = asNumber(input.apyRate);
  return {
    id: input.id,
    name: input.name,
    category,
    tagline: input.description?.slice(0, 120) || "Available in the live platform catalog.",
    description: input.description || "No description has been published for this product yet.",
    feeRate,
    apyRate,
    features: [`Fee ${(feeRate * 100).toFixed(2)}%`, apyRate > 0 ? `APY ${apyRate.toFixed(2)}%` : "Usage based"],
    tiers: [tierFor(input)],
  };
}

/** Pure mapper for the `/v1/catalog` payload; drops rows it cannot represent. */
export function normalizeCatalogPayload(payload: unknown): CatalogProduct[] {
  if (!payload || typeof payload !== "object") return [];
  const products = (payload as { products?: unknown }).products;
  if (!Array.isArray(products)) return [];
  return products
    .map((entry) => normalizeProduct(entry as ApiProduct))
    .filter((entry): entry is CatalogProduct => entry !== null && entry.id !== undefined);
}

export type FetchCatalogOptions = {
  /** Explicit `null` forces the demo catalog without any network call. */
  baseUrl?: string | null;
  fetchImpl?: typeof fetch;
  fallback?: CatalogProduct[];
  timeoutMs?: number;
};

export function platformApiBaseUrl(): string | null {
  const base = process.env.PLATFORM_API_URL ?? process.env.NEXT_PUBLIC_PLATFORM_API_URL;
  return base ? base.replace(/\/$/, "") : null;
}

export async function fetchPlatformCatalog(options: FetchCatalogOptions = {}): Promise<CatalogResult> {
  const fallback = options.fallback ?? catalogProducts;
  const baseUrl = options.baseUrl === null ? null : (options.baseUrl ?? platformApiBaseUrl());
  if (!baseUrl) return { products: fallback, source: "demo" };

  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(`${baseUrl}/v1/catalog`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? 2500),
    });
    if (!response.ok) return { products: fallback, source: "demo" };
    const products = normalizeCatalogPayload(await response.json());
    return products.length ? { products, source: "live" } : { products: fallback, source: "demo" };
  } catch {
    // Unreachable/timeout/TLS failures all degrade to the demo catalog.
    return { products: fallback, source: "demo" };
  }
}
