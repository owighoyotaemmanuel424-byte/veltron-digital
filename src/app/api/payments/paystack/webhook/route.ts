import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyPaystackSignature } from "@/lib/paystack";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
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
  // This endpoint intentionally does not mark payments as paid or fulfil orders.
  // A reconciliation worker must independently verify the provider transaction,
  // match reference/amount/currency/order, then update state idempotently.
  return NextResponse.json({ received: true, referenceRecorded: reference.length > 0 });
}
