import { NextRequest, NextResponse } from "next/server";
import { ServiceStatus } from "@prisma/client";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const createSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(2000),
  category: z.string().trim().min(2).max(80),
  priceMinor: z.number().int().positive().max(100_000_000),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("NGN"),
  status: z.nativeEnum(ServiceStatus).default(ServiceStatus.DRAFT),
});
const patchSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(5).max(2000).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  priceMinor: z.number().int().positive().max(100_000_000).optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).optional(),
  status: z.nativeEnum(ServiceStatus).optional(),
}).refine((value) => Object.keys(value).some((key) => key !== "id"), { message: "At least one field must be updated." });

async function authorized(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return { response: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  }
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).origin !== request.nextUrl.origin) {
      return { response: NextResponse.json({ error: "Same-origin request required." }, { status: 403 }) };
    }
  }
  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await authorized(request);
  if ("response" in auth) return auth.response;
  try {
    const services = await prisma.service.findMany({
      select: { id: true, slug: true, name: true, description: true, category: true, priceMinor: true, currency: true, status: true, createdAt: true, updatedAt: true, _count: { select: { orders: true } } },
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
    });
    return NextResponse.json({ services }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load services." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorized(request);
  if ("response" in auth) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the service fields. Prices must be positive integer minor units (for NGN, kobo)." }, { status: 400 });
  try {
    const service = await prisma.service.create({ data: parsed.data });
    await writeAudit({ actorId: auth.user.id, action: "admin.service.created", entityType: "Service", entityId: service.id, details: { slug: service.slug, status: service.status } });
    return NextResponse.json({ service }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not create service. The slug may already exist." }, { status: 409 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authorized(request);
  if ("response" in auth) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid service update." }, { status: 400 });
  const { id, ...data } = parsed.data;
  try {
    const service = await prisma.service.update({ where: { id }, data });
    await writeAudit({ actorId: auth.user.id, action: "admin.service.updated", entityType: "Service", entityId: id, details: data as never });
    return NextResponse.json({ service }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not update service. Check the service ID and slug uniqueness." }, { status: 409 });
  }
}
