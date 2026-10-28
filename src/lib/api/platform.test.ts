import { describe, expect, it, vi } from "vitest";

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

describe("catalog mapping", () => {
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
  const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

  it("reports unavailable — never demo data — when the API is not configured", async () => {
    const fetchImpl = vi.fn();
    const result = await fetchPlatformCatalog({ baseUrl: null, fetchImpl: fetchImpl as never });
    expect(result.status).toBe("unavailable");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns live products on a healthy response", async () => {
    const fetchImpl = vi.fn(async () => ok({ products: rows }));
    const result = await fetchPlatformCatalog({ baseUrl: "https://api.test", fetchImpl: fetchImpl as never });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("expected ok");
    expect(result.products).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledWith("https://api.test/v1/catalog", expect.objectContaining({ cache: "no-store" }));
  });

  it("surfaces failures as unavailable instead of substituting fixtures", async () => {
    const impls = [
      vi.fn(async () => ({ ok: false, status: 502, json: async () => ({}) }) as unknown as Response),
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    ];
    for (const impl of impls) {
      const result = await fetchPlatformCatalog({ baseUrl: "https://api.test", fetchImpl: impl as never });
      expect(result.status).toBe("unavailable");
      if (result.status !== "unavailable") throw new Error("expected unavailable");
      expect(result.reason).toBe("catalog_unreachable");
    }
  });

  it("distinguishes an empty live catalog from an outage", async () => {
    const fetchImpl = vi.fn(async () => ok({ products: [] }));
    const result = await fetchPlatformCatalog({ baseUrl: "https://api.test", fetchImpl: fetchImpl as never });
    expect(result).toEqual({ status: "ok", products: [] });
  });
});
