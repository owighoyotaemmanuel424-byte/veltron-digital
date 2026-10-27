export type CatalogCategory = "website" | "digital" | "call" | "mail" | "generator";

export type CatalogProduct = {
  id: string;
  category: CatalogCategory;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  price: { amount: number; currency: "USD"; interval: "one-time" | "monthly" | "usage" };
  features: string[];
  fulfillment: "instant" | "manual" | "provisioned";
  requiresKyc?: boolean;
  status: "demo";
};
