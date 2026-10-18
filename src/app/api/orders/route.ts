import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({
  serviceId: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(1000).default(1),
  customerInput: z.record(z.string(), z.string().trim().max(500)).optional(),
  idempotencyKey: z.string().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      select: { publicId: true, status: true, quantity: true, unitPriceMinor: true, totalMinor: true, currency: true, createdAt: true, updatedAt: true, service: { select: { name: true, category: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load your orders." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in before placing an order." }, { status: 401 });
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
    }
  } catch {
    // Malformed Origin headers must be rejected, not allowed to escape as a 500.
    return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a service and provide a valid idempotency key." }, { status: 400 });

  const idempotencyKey = parsed.data.idempotencyKey;
  const existingOrder = async () => prisma.order.findUnique({
    where: { idempotencyKey },
    select: { id: true, publicId: true, userId: true, status: true, totalMinor: true, currency: true },
  });
  const respondForExisting = (existing: Awaited<ReturnType<typeof existingOrder>>) => {
    if (!existing) return null;
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Idempotency key conflict." }, { status: 409 });
    }
    return NextResponse.json(
      { order: { publicId: existing.publicId, status: existing.status, totalMinor: existing.totalMinor, currency: existing.currency }, reused: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  };

  try {
    const existing = respondForExisting(await existingOrder());
    if (existing) return existing;

    const service = await prisma.service.findFirst({ where: { id: parsed.data.serviceId, status: "ACTIVE" }, select: { id: true, name: true, priceMinor: true, currency: true } });
    if (!service) return NextResponse.json({ error: "This service is not currently available." }, { status: 404 });
    const totalMinor = service.priceMinor * parsed.data.quantity;
    if (!Number.isSafeInteger(totalMinor) || totalMinor <= 0) return NextResponse.json({ error: "The requested order total is invalid." }, { status: 400 });
    const order = await prisma.order.create({
      data: {
        userId: user.id, serviceId: service.id, quantity: parsed.data.quantity,
        unitPriceMinor: service.priceMinor, totalMinor, currency: service.currency,
        customerInput: parsed.data.customerInput ? parsed.data.customerInput : undefined,
        idempotencyKey,
      },
      select: { id: true, publicId: true, status: true, totalMinor: true, currency: true, createdAt: true },
    });
    await writeAudit({ actorId: user.id, action: "order.created.pending", entityType: "Order", entityId: order.id, details: { serviceId: service.id, quantity: parsed.data.quantity, totalMinor, currency: service.currency } });
    return NextResponse.json({ order }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // The unique database constraint is the final arbiter when two identical
    // requests race. Re-read the winning row so retries remain idempotent.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      try {
        const existing = respondForExisting(await existingOrder());
        if (existing) return existing;
      } catch {
        // Fall through to the generic safe response if the winning row cannot be read.
      }
    }
    return NextResponse.json({ error: "Order could not be created. Refresh and try again." }, { status: 503 });
  }
}
