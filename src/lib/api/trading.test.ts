import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cancelOrder, fetchMarkets, fetchOpenOrders, fetchWallets, placeOrder } from "./trading";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchMarkets", () => {
  it("normalizes the engine snapshot", async () => {
    fetchMock.mockResolvedValue(
      json({ markets: [{ symbol: "BTC", price: 60000, change24h: 2, bid: 59999, ask: 60001, at: 1, sparkline: [1, 2] }] }),
    );
    const result = await fetchMarkets();
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.value[0].symbol).toBe("BTC");
    expect(result.value[0].sparkline).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledWith("/api/platform/markets", expect.objectContaining({ cache: "no-store" }));
  });

  it("reports an unconfigured platform", async () => {
    fetchMock.mockResolvedValue(json({ error: "platform_unconfigured", message: "PLATFORM_API_URL is not configured." }, 503));
    const result = await fetchMarkets();
    expect(result).toMatchObject({ status: "error", kind: "unconfigured" });
  });

  it("reports an unreachable platform on a network failure", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    expect(await fetchMarkets()).toMatchObject({ status: "error", kind: "unreachable" });
  });
});

describe("account reads", () => {
  it("distinguishes a missing session from an upstream outage", async () => {
    fetchMock.mockResolvedValueOnce(json({ error: "not_signed_in" }, 401));
    expect(await fetchWallets()).toMatchObject({ status: "error", kind: "signed_out" });

    fetchMock.mockResolvedValueOnce(json({ error: "boom" }, 500));
    expect(await fetchOpenOrders()).toMatchObject({ status: "error", kind: "unreachable" });
  });

  it("maps wallets into balances", async () => {
    fetchMock.mockResolvedValue(json({ wallets: [{ id: "1", currencyCode: "USD", balance: "250.00" }] }));
    const result = await fetchWallets();
    expect(result).toMatchObject({ status: "ok", value: { usd: 250 } });
  });
});

describe("placeOrder", () => {
  it("sends engine enums and string decimals", async () => {
    fetchMock.mockResolvedValue(
      json({ order: { id: "ord-1", status: "OPEN", price: 100, quantity: 0.5, filled: 0 } }, 201),
    );
    const result = await placeOrder({ symbol: "BTC", side: "Buy", kind: "Limit", amount: 0.5, price: 100 });
    expect(result).toMatchObject({ status: "ok", value: { id: "ord-1", status: "OPEN" } });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      symbol: "BTC",
      side: "BUY",
      kind: "LIMIT",
      quantity: "0.50000000",
      price: "100.00000000",
    });
  });

  it("omits the price for market orders and reports an immediate fill", async () => {
    fetchMock.mockResolvedValue(
      json({ order: { id: "ord-2", status: "FILLED", price: 100, quantity: 1, filled: 1 } }, 201),
    );
    const result = await placeOrder({ symbol: "ETH", side: "Sell", kind: "Market", amount: 1, price: 100 });
    expect(result).toMatchObject({ status: "ok", value: { status: "FILLED" } });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).not.toHaveProperty("price");
  });

  it("surfaces the engine's rejection message", async () => {
    fetchMock.mockResolvedValue(json({ error: "insufficient_funds", message: "Insufficient available balance" }, 422));
    expect(await placeOrder({ symbol: "BTC", side: "Buy", kind: "Market", amount: 1, price: 1 })).toMatchObject({
      status: "error",
      kind: "rejected",
      message: "Insufficient available balance",
    });
  });

  it("fails when the engine returns no order", async () => {
    fetchMock.mockResolvedValue(json({}, 201));
    expect(await placeOrder({ symbol: "BTC", side: "Buy", kind: "Market", amount: 1, price: 1 })).toMatchObject({
      status: "error",
    });
  });
});

describe("cancelOrder", () => {
  it("deletes by id", async () => {
    fetchMock.mockResolvedValue(json({ order: { id: "ord-1" } }));
    expect(await cancelOrder("ord-1")).toMatchObject({ status: "ok" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/platform/orders/ord-1");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
  });
});
