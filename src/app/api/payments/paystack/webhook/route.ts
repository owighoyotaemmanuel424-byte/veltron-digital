import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyPaystackSignature } from "@/lib/paystack";

export const runtime = "nodejs";
const MAX_WEBHOOK_BYTES = 256 * 1024;

export async function POST(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let event: unknown;
  try { event = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const value = event as { event?: unknown; data?: { id?: unknown; reference?: unknown } };
  if (value.event !== "charge.success" || !value.data?.reference || !value.data?.id) {
    return NextResponse.json({ received: true });
  }
  const reference = String(value.data.reference);
  const eventId = String(value.data.id);
  try {
    await prisma.webhookEvent.upsert({
      where: { provider_eventId: { provider: "PAYSTACK", eventId } },
      create: {
        provider: "PAYSTACK", eventId, eventType: "charge.success",
        payload: event as Prisma.InputJsonValue
      },
      update: {}
    });
  } catch {
    return NextResponse.json({ error: "Could not record event; retry delivery" }, { status: 500 });
  }
  // A signed event is only an input to reconciliation, not proof of a settled
  // payment. A worker must verify reference/amount/currency/order with Paystack
  // before changing payment state or fulfilling an order.
  return NextResponse.json({ received: true, referenceRecorded: reference.length > 0 });
}
