import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cancelSchema = z.object({ id: z.string().min(1).max(100), status: z.literal("CANCELLED") });

async function authorized(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return { response: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  }
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    try {
      if (!origin || new URL(origin).origin !== request.nextUrl.origin) {
        return { response: NextResponse.json({ error: "Same-origin request required." }, { status: 403 }) };
      }
    } catch {
      return { response: NextResponse.json({ error: "Same-origin request required." }, { status: 403 }) };
    }
  }
  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await authorized(request);
  if ("response" in auth) return auth.response;
  try {
    const orders = await prisma.order.findMany({
      select: {
        id: true, publicId: true, status: true, quantity: true, unitPriceMinor: true, totalMinor: true, currency: true, createdAt: true, updatedAt: true,
        user: { select: { id: true, email: true, name: true } },
        service: { select: { name: true, category: true } },
        payments: { select: { status: true, amountMinor: true, currency: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load order records." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authorized(request);
  if ("response" in auth) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Only cancellation of a pending order can be requested here." }, { status: 400 });
  try {
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, status: true, payments: { select: { status: true } } },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.status !== OrderStatus.PENDING) return NextResponse.json({ error: "Only pending orders can be cancelled here." }, { status: 409 });
    if (order.payments.some((payment) => payment.status === PaymentStatus.SUCCESS)) {
      return NextResponse.json({ error: "This order has a successful payment record. Use the reviewed refund and reconciliation process instead." }, { status: 409 });
    }
    const result = await prisma.order.updateMany({
      where: { id: order.id, status: OrderStatus.PENDING, payments: { none: { status: PaymentStatus.SUCCESS } } },
      data: { status: OrderStatus.CANCELLED },
    });
    if (result.count !== 1) return NextResponse.json({ error: "Order status changed concurrently. Refresh and review it again." }, { status: 409 });
    await writeAudit({ actorId: auth.user.id, action: "admin.order.cancelled", entityType: "Order", entityId: order.id, details: { previousStatus: order.status, status: "CANCELLED" } });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not update this order." }, { status: 503 });
  }
}
