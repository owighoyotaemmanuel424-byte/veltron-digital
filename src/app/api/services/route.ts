import { NextResponse } from "next/server";
import { ServiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { status: ServiceStatus.ACTIVE },
      select: {
        id: true, slug: true, name: true, description: true,
        category: true, priceMinor: true, currency: true, createdAt: true
      },
      orderBy: [{ category: "asc" }, { name: "asc" }]
    });
    return NextResponse.json({ services }, {
      headers: { "Cache-Control": "private, no-store" }
    });
  } catch {
    return NextResponse.json({ error: "Service catalog is temporarily unavailable." }, { status: 503 });
  }
}
