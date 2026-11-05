import { describe, expect, it } from "vitest";
import { catalogCategories, demoCatalog, getProduct } from "@/lib/demo/catalog";

describe("demo catalog route matrix", () => {
  it("contains all five verticals and the full current source catalog", () => {
    expect(catalogCategories.map((category) => category.id)).toEqual(["website", "digital", "call", "mail", "generator"]);
    expect(demoCatalog).toHaveLength(57);
    for (const category of catalogCategories) {
      expect(demoCatalog.some((product) => product.category === category.id)).toBe(true);
    }
  });

  it("resolves every product-card href to a product detail", () => {
    const routeKeys = new Set<string>();
    for (const product of demoCatalog) {
      const route = `/catalog/${product.category}/${product.slug}`;
      expect(routeKeys.has(route), `duplicate catalog route: ${route}`).toBe(false);
      routeKeys.add(route);
      expect(getProduct(product.category, product.slug), `dead product route: ${route}`).toBe(product);
      expect(product.status).toBe("demo");
    }
  });

  it("keeps all displayed prices and fulfillment labels illustrative", () => {
    for (const product of demoCatalog) {
      expect(product.price.amount).toBeGreaterThan(0);
      expect(["instant", "manual", "provisioned"]).toContain(product.fulfillment);
      expect(product.price.currency).toBe("USD");
    }
  });
});
