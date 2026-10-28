import { describe, expect, it, vi } from "vitest";

import { demoVaults } from "@/lib/demo/savings";
import { fetchPlatformVaults, normalizeVault, normalizeVaultPayload, type ApiVault } from "@/lib/api/platform";

const rows: ApiVault[] = [
  { id: "a", name: "Emergency fund", currentBalance: "1850.5", targetAmount: "5000.00", apyRate: "3.90", schedule: "WEEKLY", isLocked: false },
  { id: "b", name: null, currentBalance: "0", targetAmount: null, apyRate: "7.20", schedule: "MONTHLY", isLocked: true },
];

describe("vault mapping", () => {
  it("maps balances and targets to numbers", () => {
    const vault = normalizeVault(rows[0]!);
    expect(vault?.balance).toBe(1850.5);
    expect(vault?.target).toBe(5000);
    expect(vault?.schedule).toBe("WEEKLY");
  });

  it("defaults names and treats a missing goal as null", () => {
    const vault = normalizeVault(rows[1]! as never);
    expect(vault?.name).toBe("Savings vault");
    expect(vault?.target).toBeNull();
    expect(vault?.locked).toBe(true);
  });

  it("drops entries without an id and malformed payloads", () => {
    expect(normalizeVault({} as never)).toBeNull();
    expect(normalizeVaultPayload({ vaults: [{ id: "a", currentBalance: "1", apyRate: "1" }] })).toHaveLength(1);
    expect(normalizeVaultPayload({ vaults: "nope" })).toEqual([]);
    expect(normalizeVaultPayload(null)).toEqual([]);
  });
});

describe("fetchPlatformVaults", () => {
  const ok = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response;

  it("never calls the network without a token or base URL", async () => {
    const fetchImpl = vi.fn();
    expect((await fetchPlatformVaults({ baseUrl: "https://api.test", fetchImpl: fetchImpl as never })).source).toBe("demo");
    expect((await fetchPlatformVaults({ baseUrl: null, accessToken: "t", fetchImpl: fetchImpl as never })).source).toBe("demo");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns live vaults with a bearer token", async () => {
    const fetchImpl = vi.fn(async () => ok({ vaults: rows }));
    const result = await fetchPlatformVaults({ baseUrl: "https://api.test", accessToken: "tok", fetchImpl: fetchImpl as never });
    expect(result.source).toBe("live");
    expect(result.vaults).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.test/v1/vaults",
      expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer tok" }) }),
    );
  });

  it("falls back on errors and empty payloads", async () => {
    const impls = [
      vi.fn(async () => ({ ok: false, json: async () => ({}) }) as unknown as Response),
      vi.fn(async () => ok({ vaults: [] })),
      vi.fn(async () => { throw new Error("offline"); }),
    ];
    for (const impl of impls) {
      const result = await fetchPlatformVaults({ baseUrl: "https://api.test", accessToken: "tok", fetchImpl: impl as never });
      expect(result.source).toBe("demo");
      expect(result.vaults).toEqual(demoVaults);
    }
  });
});
