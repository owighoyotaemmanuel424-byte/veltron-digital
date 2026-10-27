import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { demoModeRequired, isDemoMode } from "@/lib/catalog/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDemoMode()) return demoModeRequired();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  try {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { publicId: id }], userId: user.id },
      select: { id: true, publicId: true, status: true, config: true, customerInput: true, price: true, totalMinor: true, currency: true, createdAt: true, fulfilledAt: true, product: { select: { id: true, category: true, slug: true, name: true, description: true, price: true, currency: true, interval: true } }, service: { select: { id: true, name: true, category: true } }, documents: { select: { id: true, type: true, payload: true, createdAt: true }, orderBy: { createdAt: "desc" } } },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order, demo: true, fulfillment: "not_implemented" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load this order." }, { status: 503 });
  }
}
