import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { randomUUID } from "node:crypto";
import { getConfigSchema } from "@/lib/catalog/schemas";
import { getProduct } from "@/lib/demo/catalog";
import { demoModeRequired, isDemoMode } from "@/lib/catalog/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!isDemoMode()) return demoModeRequired();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      select: { id: true, publicId: true, status: true, quantity: true, unitPriceMinor: true, totalMinor: true, price: true, currency: true, config: true, createdAt: true, fulfilledAt: true, service: { select: { name: true, category: true } }, product: { select: { name: true, category: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load your orders." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!isDemoMode()) return demoModeRequired();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in before placing a demo order." }, { status: 401 });
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).origin !== request.nextUrl.origin) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  } catch { return NextResponse.json({ error: "Same-origin request required." }, { status: 403 }); }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const requestSchema = z.object({
    category: z.enum(["website", "digital", "call", "mail", "generator"]),
    slug: z.string().trim().min(1).max(120),
    config: z.record(z.string(), z.unknown()),
  });
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid category, product slug, and configuration.", issues: parsed.error.issues }, { status: 400 });
  const product = getProduct(parsed.data.category, parsed.data.slug);
  if (!product) return NextResponse.json({ error: "Catalog product not found." }, { status: 404 });
  const validatedConfig = getConfigSchema(product.slug, product.category).safeParse(parsed.data.config);
  if (!validatedConfig.success) return NextResponse.json({ error: "Product configuration is invalid.", issues: validatedConfig.error.issues }, { status: 400 });

  const safeConfig: Record<string, unknown> = { ...validatedConfig.data };
  // Generator configurations are placeholders: never persist user-supplied real transaction hashes,
  // account identifiers, or receipt references as if they were verified financial data.
  if (product.slug === "crypto-receipts") safeConfig.txHashPreview = "DEMO-HASH-NOT-A-REAL-TRANSACTION";
  if (product.slug === "bank-receipt") {
    safeConfig.accountMask = "DEMO ACCOUNT — NOT REAL";
    safeConfig.reference = "DEMO-BANK-REFERENCE-NOT-A-REAL-TRANSACTION";
  }
  if (product.slug === "store-receipt") safeConfig.orderId = "DEMO-STORE-ORDER-NOT-A-REAL-SALE";
  // DEMO STUB ONLY: provisioning/fulfillment is NOT implemented. Every created order stays PENDING.
  // This route never calls a provider, sends a message, transfers money, or provisions a service.
  try {
    const dbProduct = await prisma.product.upsert({
      where: { category_slug: { category: product.category, slug: product.slug } },
      update: { name: product.name, description: product.description, price: product.price.amount, currency: product.price.currency, interval: product.price.interval, active: true, metadata: { icon: product.icon, tagline: product.tagline, features: product.features } },
      create: { category: product.category, slug: product.slug, name: product.name, description: product.description, price: product.price.amount, currency: product.price.currency, interval: product.price.interval, metadata: { icon: product.icon, tagline: product.tagline, features: product.features } },
    });
    const priceMinor = Math.round(product.price.amount * 100);
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        productId: dbProduct.id,
        status: "PENDING",
        quantity: 1,
        unitPriceMinor: priceMinor,
        totalMinor: priceMinor,
        currency: product.price.currency,
        customerInput: safeConfig as Prisma.InputJsonValue,
        config: safeConfig as Prisma.InputJsonValue,
        price: product.price.amount,
        idempotencyKey: `demo:${randomUUID()}`,
      },
      select: { id: true, publicId: true, status: true, config: true, price: true, currency: true, createdAt: true },
    });
    return NextResponse.json({ orderId: order.id, order: { ...order, status: "PENDING" as const }, demo: true, fulfillment: "not_implemented" as const }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Demo order could not be persisted. Check the database migration and connection." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
