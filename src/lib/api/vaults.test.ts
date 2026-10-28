import { describe, expect, it, vi } from "vitest";

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
    const vault = normalizeVault(rows[1]!);
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
  const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

  it("refuses to read vaults without a session token", async () => {
    const fetchImpl = vi.fn();
    const result = await fetchPlatformVaults({ baseUrl: "https://api.test", fetchImpl: fetchImpl as never });
    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") throw new Error("expected unavailable");
    expect(result.reason).toBe("not_signed_in");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns live vaults with a bearer token", async () => {
    const fetchImpl = vi.fn(async () => ok({ vaults: rows }));
    const result = await fetchPlatformVaults({ baseUrl: "https://api.test", accessToken: "tok", fetchImpl: fetchImpl as never });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("expected ok");
    expect(result.vaults).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.test/v1/vaults",
      expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer tok" }) }),
    );
  });

  it("reports unavailable when the platform errors", async () => {
    const impls = [
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }) as unknown as Response),
      vi.fn(async () => {
        throw new Error("offline");
      }),
    ];
    for (const impl of impls) {
      const result = await fetchPlatformVaults({ baseUrl: "https://api.test", accessToken: "tok", fetchImpl: impl as never });
      expect(result.status).toBe("unavailable");
    }
  });
});
