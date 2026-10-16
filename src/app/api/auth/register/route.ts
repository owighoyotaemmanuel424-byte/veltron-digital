import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { enforceAuthRateLimit } from "@/lib/auth-rate-limit";
export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email().max(254), name: z.string().trim().min(1).max(100).optional(), password: z.string().min(12).max(128) });
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email, optional name, and password of at least 12 characters." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  try {
    const allowed = await enforceAuthRateLimit("register", email, 5, 60 * 60);
    if (!allowed) return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } });
    const user = await prisma.user.create({ data: { email, name: parsed.data.name, passwordHash: await hashPassword(parsed.data.password), walletAccounts: { create: { currency: "NGN" } } }, select: { id: true, email: true, name: true } });
    await createSession(user.id);
    await writeAudit({ actorId: user.id, action: "auth.register", entityType: "User", entityId: user.id, ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null, userAgent: request.headers.get("user-agent") ?? null });
    return NextResponse.json({ user }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Registration is temporarily unavailable. The email may already be registered." }, { status: 503 });
  }
}
