import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { demoModeRequired, isDemoMode } from "@/lib/catalog/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isDemoMode()) return demoModeRequired();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).origin !== request.nextUrl.origin) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  } catch { return NextResponse.json({ error: "Same-origin request required." }, { status: 403 }); }
  const { id } = await context.params;
  try {
    const order = await prisma.order.findFirst({ where: { OR: [{ id }, { publicId: id }], userId: user.id }, select: { id: true, status: true } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.status !== "PENDING") return NextResponse.json({ error: "Only pending demo orders can be cancelled.", status: order.status }, { status: 409 });
    const cancelled = await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" }, select: { id: true, publicId: true, status: true, createdAt: true } });
    // This is a local demo status change only; no provider or fulfillment service is called.
    return NextResponse.json({ order: cancelled, demo: true, fulfillment: "not_implemented" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not cancel this order." }, { status: 503 });
  }
}
