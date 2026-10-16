import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { decryptTotpSecret, verifyTotp } from "@/lib/totp";
import { writeAudit } from "@/lib/audit";
export const runtime = "nodejs";
const schema = z.object({ code: z.string().regex(/^\d{6}$/) });
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter the six-digit code from your authenticator." }, { status: 400 });
  try {
    const record = await prisma.user.findUnique({ where: { id: user.id }, select: { twoFactorSecret: true } });
    if (!record?.twoFactorSecret || !verifyTotp(decryptTotpSecret(record.twoFactorSecret), parsed.data.code)) return NextResponse.json({ error: "The authenticator code is invalid or expired." }, { status: 400 });
    const recoveryCodes = Array.from({ length: 10 }, () => randomBytes(10).toString("hex").toUpperCase());
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
      await tx.recoveryCode.deleteMany({ where: { userId: user.id } });
      await tx.recoveryCode.createMany({
        data: recoveryCodes.map((code) => ({
          userId: user.id,
          codeHash: createHash("sha256").update(code).digest("hex"),
        })),
      });
    });
    await writeAudit({ actorId: user.id, action: "auth.2fa.enabled", entityType: "User", entityId: user.id, details: { recoveryCodesIssued: recoveryCodes.length } });
    return NextResponse.json({ success: true, recoveryCodes }, { headers: { "Cache-Control": "no-store", "Pragma": "no-cache" } });
  } catch {
    return NextResponse.json({ error: "Could not confirm two-factor setup." }, { status: 503 });
  }
}
