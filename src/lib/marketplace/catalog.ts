export type CatalogCategory = "GLOBAL_BUSINESS" | "CRYPTO_EXCHANGE" | "SAVINGS_VAULT" | "ANALYTICS_PRO";

export type CatalogTier = {
  name: string;
  priceMonthly: number;
  apy: number | null;
  feeRate: number;
  limits: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  category: CatalogCategory;
  tagline: string;
  description: string;
  feeRate: number;
  apyRate: number;
  features: string[];
  tiers: CatalogTier[];
};

export const categoryLabels: Record<CatalogCategory, string> = {
  GLOBAL_BUSINESS: "Global Business",
  CRYPTO_EXCHANGE: "Crypto Exchange",
  SAVINGS_VAULT: "Yield Vaults",
  ANALYTICS_PRO: "Pro Analytics",
};

export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

export const percent = (value: number) => `${value.toFixed(2)}%`;
