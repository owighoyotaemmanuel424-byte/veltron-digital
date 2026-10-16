import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { decryptTotpSecret, verifyTotp } from "@/lib/totp";
import { writeAudit } from "@/lib/audit";
export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128), totpCode: z.string().optional() });
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || user.status !== "ACTIVE" || !(await verifyPassword(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    if (user.twoFactorEnabled && (!user.twoFactorSecret || !parsed.data.totpCode || !verifyTotp(decryptTotpSecret(user.twoFactorSecret), parsed.data.totpCode))) return NextResponse.json({ error: "A valid authenticator code is required." }, { status: 401 });
    await createSession(user.id);
    await writeAudit({ actorId: user.id, action: "auth.login", entityType: "User", entityId: user.id, ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null, userAgent: request.headers.get("user-agent") ?? null });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, twoFactorEnabled: user.twoFactorEnabled } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
