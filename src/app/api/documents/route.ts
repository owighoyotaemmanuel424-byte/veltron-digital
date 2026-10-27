import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { demoModeRequired, isDemoMode } from "@/lib/catalog/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDemoMode()) return demoModeRequired();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const documents = await prisma.document.findMany({
      where: { order: { userId: user.id, product: { is: { category: "generator" } } } },
      select: { id: true, orderId: true, type: true, payload: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ documents, demo: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load demo documents. Apply the catalog API migration first." }, { status: 503 });
  }
}

const schema = z.object({
  orderId: z.string().trim().min(1).max(128),
  type: z.enum(["crypto", "bank", "store"]),
  payload: z.object({
    title: z.string().trim().max(120).optional(),
    merchant: z.string().trim().max(100).optional(),
    amount: z.union([z.string().max(32), z.number().finite().nonnegative()]).optional(),
    style: z.enum(["standard", "minimal", "branded"]).optional(),
    note: z.string().trim().max(300).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  if (!isDemoMode()) return demoModeRequired();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).origin !== request.nextUrl.origin) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  } catch { return NextResponse.json({ error: "Same-origin request required." }, { status: 403 }); }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid generator order, document type, and mock payload.", issues: parsed.error.issues }, { status: 400 });
  try {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: parsed.data.orderId }, { publicId: parsed.data.orderId }], userId: user.id, product: { category: "generator" } },
      select: { id: true, product: { select: { slug: true, name: true } } },
    });
    if (!order) return NextResponse.json({ error: "A generator product order owned by your account is required." }, { status: 400 });
    const expectedType = order.product?.slug === "crypto-receipts" ? "crypto" : order.product?.slug === "bank-receipt" ? "bank" : order.product?.slug === "store-receipt" ? "store" : null;
    if (!expectedType || parsed.data.type !== expectedType) return NextResponse.json({ error: "Document type must match the purchased generator." }, { status: 400 });
    // Never accept or persist real transaction hashes, account numbers, credentials, or payment evidence.
    // Provisioning/fulfillment is NOT implemented; the source order remains PENDING.
    const document = await prisma.document.create({
      data: {
        orderId: order.id,
        type: parsed.data.type,
        payload: {
          title: parsed.data.payload?.title ?? order.product.name,
          merchant: parsed.data.payload?.merchant ?? "Veltron Demo Store",
          amount: parsed.data.payload?.amount ?? "0.00 (illustrative)",
          style: parsed.data.payload?.style ?? "standard",
          note: parsed.data.payload?.note ?? "Demo document — not proof of payment.",
          reference: `DEMO-${parsed.data.type.toUpperCase()}-NOT-A-REAL-TRANSACTION`,
          ...(parsed.data.type === "crypto" ? { txHash: "DEMO-HASH-NOT-A-REAL-TRANSACTION" } : {}),
          ...(parsed.data.type === "bank" ? { account: "DEMO ACCOUNT — NOT REAL" } : {}),
          disclaimer: "Demo document — not a real receipt. No real transaction, bank account, or crypto activity is represented.",
        },
      },
      select: { id: true, orderId: true, type: true, payload: true, createdAt: true },
    });
    return NextResponse.json({ document, demo: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not save demo document. Apply the catalog API migration first." }, { status: 503 });
  }
}
