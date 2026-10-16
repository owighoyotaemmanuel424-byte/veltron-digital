import { NextRequest, NextResponse } from "next/server";
import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const patchSchema = z.object({
  id: z.string().min(1).max(100),
  status: z.nativeEnum(UserStatus).optional(),
  role: z.enum(["CUSTOMER", "SUPPORT", "ADMIN"]).optional(),
}).refine((value) => value.status !== undefined || value.role !== undefined, { message: "Choose a status or role to update." });

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
  if (auth.response) return auth.response;
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  try {
    const users = await prisma.user.findMany({
      where: query ? { OR: [{ email: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }] } : undefined,
      select: { id: true, email: true, name: true, role: true, status: true, emailVerifiedAt: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load users." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authorized(request);
  if (auth.response) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid user update." }, { status: 400 });
  const { id, ...changes } = parsed.data;
  if (id === auth.user.id) return NextResponse.json({ error: "You cannot change your own role or status here." }, { status: 409 });
  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, status: true } });
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (target.role === UserRole.SUPER_ADMIN) return NextResponse.json({ error: "Super-admin accounts cannot be changed through user management." }, { status: 403 });
    if (changes.role !== undefined && auth.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Only a super-admin can change user roles." }, { status: 403 });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { ...(changes.status !== undefined ? { status: changes.status } : {}), ...(changes.role !== undefined ? { role: changes.role as UserRole } : {}) },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });
    await writeAudit({ actorId: auth.user.id, action: "admin.user.updated", entityType: "User", entityId: id, details: { previousRole: target.role, previousStatus: target.status, changes } });
    return NextResponse.json({ user: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not update this user." }, { status: 503 });
  }
}
