import { categoryLabels, type CatalogCategory, type CatalogProduct, type CatalogTier } from "@/lib/marketplace/catalog";
import type { SavingsVaultView, VaultSchedule } from "@/lib/finance/vaults";

/**
 * Typed client for the platform API (`services/platform`).
 *
 * There is no demo fallback: a caller either gets data the platform returned, or
 * an explicit `unavailable` result it is expected to render as an error state.
 * Silently substituting fixtures would make a live screen misreport its source.
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

export type ApiVault = {
  id: string;
  name?: string | null;
  currentBalance: string | number;
  targetAmount?: string | number | null;
  apyRate: string | number;
  schedule?: VaultSchedule;
  isLocked?: boolean;
};

export type CatalogResult =
  | { status: "ok"; products: CatalogProduct[] }
  | { status: "unavailable"; reason: string; detail?: string };

export type VaultsResult =
  | { status: "ok"; vaults: SavingsVaultView[] }
  | { status: "unavailable"; reason: string; detail?: string };

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
  return { name: "Standard", priceMonthly: 0, apy: apy > 0 ? apy : null, feeRate, limits: "Contact sales" };
}

export function normalizeProduct(input: ApiProduct): CatalogProduct | null {
  const category = CATEGORY_MAP[input.category?.toUpperCase?.() ?? ""];
  if (!category || !input.name) return null;
  const feeRate = asNumber(input.feeRate);
  const apyRate = asNumber(input.apyRate);
  return {
    id: input.id,
    name: input.name,
    category,
    tagline: input.description?.slice(0, 120) || categoryLabels[category],
    description: input.description || "No description has been published for this product yet.",
    feeRate,
    apyRate,
    features: [
      `Fee ${(feeRate * 100).toFixed(2)}%`,
      apyRate > 0 ? `APY ${apyRate.toFixed(2)}%` : "Usage based",
    ],
    tiers: [tierFor(input)],
  };
}

export function normalizeCatalogPayload(payload: unknown): CatalogProduct[] {
  if (!payload || typeof payload !== "object") return [];
  const products = (payload as { products?: unknown }).products;
  if (!Array.isArray(products)) return [];
  return products.map((entry) => normalizeProduct(entry as ApiProduct)).filter((entry): entry is CatalogProduct => entry !== null);
}

export function normalizeVault(input: ApiVault): SavingsVaultView | null {
  if (!input?.id) return null;
  const balance = asNumber(input.currentBalance);
  const target = input.targetAmount === null || input.targetAmount === undefined ? null : asNumber(input.targetAmount);
  return {
    id: input.id,
    name: input.name?.trim() || "Savings vault",
    balance: Number.isFinite(balance) ? balance : 0,
    target: target !== null && target > 0 ? target : null,
    apy: asNumber(input.apyRate),
    schedule: input.schedule ?? "MONTHLY",
    locked: input.isLocked ?? false,
  };
}

export function normalizeVaultPayload(payload: unknown): SavingsVaultView[] {
  if (!payload || typeof payload !== "object") return [];
  const vaults = (payload as { vaults?: unknown }).vaults;
  if (!Array.isArray(vaults)) return [];
  return vaults.map((entry) => normalizeVault(entry as ApiVault)).filter((entry): entry is SavingsVaultView => entry !== null);
}

export function platformApiBaseUrl(): string | null {
  const base = process.env.PLATFORM_API_URL ?? process.env.NEXT_PUBLIC_PLATFORM_API_URL;
  return base ? base.replace(/\/$/, "") : null;
}

type RequestOptions = { baseUrl?: string | null; fetchImpl?: typeof fetch; timeoutMs?: number };

async function request(path: string, options: RequestOptions & { accessToken?: string }): Promise<unknown> {
  const baseUrl = options.baseUrl === null ? null : (options.baseUrl ?? platformApiBaseUrl());
  if (!baseUrl) throw new Error("PLATFORM_API_URL is not configured");
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${baseUrl}${path}`, {
    headers: {
      accept: "application/json",
      ...(options.accessToken ? { authorization: `Bearer ${options.accessToken}` } : {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 4000),
  });
  if (!response.ok) throw new Error(`platform request failed (HTTP ${response.status})`);
  return response.json();
}

export async function fetchPlatformCatalog(options: RequestOptions = {}): Promise<CatalogResult> {
  try {
    const products = normalizeCatalogPayload(await request("/v1/catalog", options));
    return { status: "ok", products };
  } catch (error) {
    return { status: "unavailable", reason: "catalog_unreachable", detail: error instanceof Error ? error.message : undefined };
  }
}

export async function fetchPlatformVaults(options: RequestOptions & { accessToken?: string } = {}): Promise<VaultsResult> {
  if (!options.accessToken) {
    return { status: "unavailable", reason: "not_signed_in", detail: "A platform session token is required to read vaults." };
  }
  try {
    const vaults = normalizeVaultPayload(await request("/v1/vaults", options));
    return { status: "ok", vaults };
  } catch (error) {
    return { status: "unavailable", reason: "vaults_unreachable", detail: error instanceof Error ? error.message : undefined };
  }
}
