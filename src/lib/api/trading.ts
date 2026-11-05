import {
  engineKind,
  engineSide,
  toAssets,
  toBalances,
  toCandles,
  toOpenOrders,
  type Asset,
  type Balances,
  type Candle,
  type OpenOrder,
  type OrderInput,
  type Timeframe,
} from "@/lib/crypto/market";

/**
 * Browser client for the platform trading surface.
 *
 * Every call goes through this app's `/api/platform/*` route handlers, which
 * hold the session token server-side. Results are discriminated unions instead
 * of exceptions, so the UI can distinguish "not signed in" from "engine
 * rejected the order" from "API unreachable" and say the right thing.
 */

export type FailureKind = "unconfigured" | "signed_out" | "rejected" | "unreachable";

export type Failure = { status: "error"; kind: FailureKind; message: string };
export type Result<T> = { status: "ok"; value: T } | Failure;

const MESSAGES: Record<FailureKind, string> = {
  unconfigured: "The platform API is not configured for this deployment.",
  signed_out: "Sign in to a platform account to trade.",
  rejected: "The platform rejected that request.",
  unreachable: "The platform API could not be reached.",
};

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function call(path: string, init?: RequestInit): Promise<{ ok: true; data: Record<string, unknown> } | Failure> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: { accept: "application/json", ...(init?.body ? { "content-type": "application/json" } : {}), ...init?.headers },
    });
  } catch {
    return { status: "error", kind: "unreachable", message: MESSAGES.unreachable };
  }

  const data = await readJson(response);
  if (response.ok) return { ok: true, data };

  const kind: FailureKind =
    response.status === 401
      ? "signed_out"
      : response.status === 503
        ? "unconfigured"
        : response.status >= 400 && response.status < 500
          ? "rejected"
          : "unreachable";

  const message = typeof data.message === "string" ? data.message : MESSAGES[kind];
  return { status: "error", kind, message };
}

export async function fetchMarkets(): Promise<Result<Asset[]>> {
  const result = await call("/api/platform/markets");
  if ("status" in result) return result;
  const assets = toAssets(result.data);
  if (assets.length === 0) {
    return { status: "error", kind: "unreachable", message: "The engine returned no tradable symbols." };
  }
  return { status: "ok", value: assets };
}

export async function fetchCandles(symbol: string, timeframe: Timeframe): Promise<Result<Candle[]>> {
  const result = await call(`/api/platform/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
  if ("status" in result) return result;
  return { status: "ok", value: toCandles(result.data) };
}

export async function fetchWallets(): Promise<Result<Balances>> {
  const result = await call("/api/platform/wallets");
  if ("status" in result) return result;
  return { status: "ok", value: toBalances(result.data) };
}

export async function fetchOpenOrders(): Promise<Result<OpenOrder[]>> {
  const result = await call("/api/platform/orders");
  if ("status" in result) return result;
  return { status: "ok", value: toOpenOrders(result.data) };
}

/** Summary of what the engine accepted: market orders fill immediately. */
export type PlacedOrder = {
  id: string;
  status: "OPEN" | "FILLED";
  price: number;
  quantity: number;
  filled: number;
};

export async function placeOrder(input: OrderInput): Promise<Result<PlacedOrder>> {
  const result = await call("/api/platform/orders", {
    method: "POST",
    body: JSON.stringify({
      symbol: input.symbol,
      side: engineSide(input.side),
      kind: engineKind(input.kind),
      quantity: input.amount.toFixed(8),
      ...(input.kind === "Limit" ? { price: input.price.toFixed(8) } : {}),
    }),
  });
  if ("status" in result) return result;

  const order = result.data.order as
    | { id?: unknown; status?: unknown; price?: unknown; quantity?: unknown; filled?: unknown }
    | undefined;
  if (!order || typeof order.id !== "string") {
    return { status: "error", kind: "unreachable", message: "The engine did not return an order." };
  }
  return {
    status: "ok",
    value: {
      id: order.id,
      status: order.status === "OPEN" ? "OPEN" : "FILLED",
      price: Number(order.price ?? input.price),
      quantity: Number(order.quantity ?? input.amount),
      filled: Number(order.filled ?? 0),
    },
  };
}

export async function cancelOrder(id: string): Promise<Result<null>> {
  const result = await call(`/api/platform/orders/${encodeURIComponent(id)}`, { method: "DELETE" });
  if ("status" in result) return result;
  return { status: "ok", value: null };
}
