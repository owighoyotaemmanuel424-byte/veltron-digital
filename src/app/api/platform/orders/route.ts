import { NextResponse } from "next/server";
import { z } from "zod";

import { proxyPlatform } from "@/lib/api/platformProxy";

export const dynamic = "force-dynamic";

const decimal = z.string().regex(/^\d+(\.\d{1,8})?$/, "amount must be a positive decimal");

const orderInput = z.object({
  symbol: z.string().regex(/^[A-Za-z0-9]{2,12}$/),
  side: z.enum(["BUY", "SELL"]),
  kind: z.enum(["MARKET", "LIMIT"]),
  quantity: decimal,
  price: decimal.optional(),
});

/** Resting orders for the signed-in account, plus current tickers. */
export async function GET() {
  return proxyPlatform("/v1/orders");
}

/** Places an order with the engine; funds are locked inside the platform. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = orderInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_order", issues: parsed.error.issues.map((issue) => issue.message) },
      { status: 422 },
    );
  }

  return proxyPlatform("/v1/orders", { method: "POST", body: parsed.data });
}
