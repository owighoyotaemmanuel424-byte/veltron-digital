import { NextResponse } from "next/server";

import { proxyPlatform } from "@/lib/api/platformProxy";

export const dynamic = "force-dynamic";

/** Cancels a resting order and releases the funds the platform had locked. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[A-Za-z0-9-]{1,64}$/.test(id)) {
    return NextResponse.json({ error: "invalid_order_id" }, { status: 422 });
  }
  return proxyPlatform(`/v1/orders/${encodeURIComponent(id)}`, { method: "DELETE" });
}
