import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { decryptTotpSecret, verifyTotp } from "@/lib/totp";
import { writeAudit } from "@/lib/audit";
import { enforceAuthRateLimit, getClientAddress } from "@/lib/auth-rate-limit";
export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128), totpCode: z.string().optional(), recoveryCode: z.string().trim().min(20).max(64).optional() });
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  try {
    const allowed = await enforceAuthRateLimit("login", parsed.data.email, 8, 15 * 60);
    if (!allowed) return NextResponse.json({ error: "Too many sign-in attempts. Please wait 15 minutes and try again." }, { status: 429, headers: { "Retry-After": "900", "Cache-Control": "no-store" } });
    const ipAllowed = await enforceAuthRateLimit("login-ip", getClientAddress(request.headers), 30, 15 * 60);
    if (!ipAllowed) return NextResponse.json({ error: "Too many sign-in attempts from this network. Please wait 15 minutes and try again." }, { status: 429, headers: { "Retry-After": "900", "Cache-Control": "no-store" } });
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    if (!user.emailVerifiedAt || user.status === "PENDING") return NextResponse.json({ error: "Verify your email before signing in. You can request a new verification link from the sign-up page." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    if (user.status !== "ACTIVE") return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    if (user.twoFactorEnabled) {
      const totpValid = Boolean(user.twoFactorSecret && parsed.data.totpCode && verifyTotp(decryptTotpSecret(user.twoFactorSecret), parsed.data.totpCode));
      if (!totpValid) {
        const code = parsed.data.recoveryCode?.replace(/[\\s-]/g, "").toUpperCase();
        if (!code || !/^[A-F0-9]{20}$/.test(code)) {
          return NextResponse.json({ error: "A valid authenticator or unused recovery code is required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
        }
        const consumed = await prisma.recoveryCode.updateMany({
          where: { userId: user.id, codeHash: createHash("sha256").update(code).digest("hex"), usedAt: null },
          data: { usedAt: new Date() },
        });
        if (consumed.count !== 1) return NextResponse.json({ error: "That recovery code is invalid or has already been used." }, { status: 401, headers: { "Cache-Control": "no-store" } });
      }
    }
    await createSession(user.id);
    await writeAudit({ actorId: user.id, action: "auth.login", entityType: "User", entityId: user.id, ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null, userAgent: request.headers.get("user-agent") ?? null });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, twoFactorEnabled: user.twoFactorEnabled } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
