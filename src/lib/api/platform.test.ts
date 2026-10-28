import { describe, expect, it, vi } from "vitest";

import { catalogProducts } from "@/lib/demo/catalog";
import { fetchPlatformCatalog, normalizeCatalogPayload, normalizeProduct } from "@/lib/api/platform";

const rows = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Flexible Yield Vault",
    category: "SAVINGS_VAULT",
    description: "Withdraw anytime, accrue daily.",
    feeRate: "0.0005",
    apyRate: "4.85",
    isActive: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Spot Exchange Desk",
    category: "CRYPTO_PAIR",
    description: "38 pairs.",
    feeRate: "0.0010",
    apyRate: "0.00",
    isActive: true,
  },
];

describe("platform catalog mapping", () => {
  it("maps API categories onto catalog categories with numeric rates", () => {
    const mapped = normalizeCatalogPayload({ products: rows });
    expect(mapped).toHaveLength(2);
    expect(mapped[0]?.category).toBe("SAVINGS_VAULT");
    expect(mapped[0]?.apyRate).toBe(4.85);
    expect(mapped[1]?.category).toBe("CRYPTO_EXCHANGE");
    expect(mapped[1]?.tiers[0]?.apy).toBeNull();
  });

  it("drops rows with unknown categories or missing names", () => {
    expect(normalizeProduct({ ...rows[0]!, category: "MYSTERY" } as never)).toBeNull();
    expect(normalizeProduct({ ...rows[0]!, name: "" } as never)).toBeNull();
    expect(normalizeCatalogPayload({ products: [{ id: "x", category: "MYSTERY" }] })).toEqual([]);
  });

  it("treats malformed payloads as empty instead of throwing", () => {
    expect(normalizeCatalogPayload(null)).toEqual([]);
    expect(normalizeCatalogPayload({ products: "nope" })).toEqual([]);
    expect(normalizeCatalogPayload([])).toEqual([]);
  });
});

describe("fetchPlatformCatalog", () => {
  const okResponse = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response;

  it("returns demo data without calling fetch when no base URL is configured", async () => {
    const fetchImpl = vi.fn();
    const result = await fetchPlatformCatalog({ baseUrl: null, fetchImpl: fetchImpl as never });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.source).toBe("demo");
    expect(result.products).toEqual(catalogProducts);
  });

  it("returns live products on a healthy response", async () => {
    const fetchImpl = vi.fn(async () => okResponse({ products: rows }));
    const result = await fetchPlatformCatalog({ baseUrl: "https://api.test", fetchImpl: fetchImpl as never });
    expect(result.source).toBe("live");
    expect(result.products).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledWith("https://api.test/v1/catalog", expect.objectContaining({ cache: "no-store" }));
  });

  it("falls back on non-2xx, empty payloads and network errors", async () => {
    const notOk = vi.fn(async () => ({ ok: false, json: async () => ({}) }) as unknown as Response);
    const empty = vi.fn(async () => okResponse({ products: [] }));
    const boom = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });

    for (const impl of [notOk, empty, boom]) {
      const result = await fetchPlatformCatalog({ baseUrl: "https://api.test", fetchImpl: impl as never });
      expect(result.source).toBe("demo");
      expect(result.products).toEqual(catalogProducts);
    }
  });
});
