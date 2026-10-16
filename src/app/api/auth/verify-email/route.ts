import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashVerificationToken } from "@/lib/email-verification";
import { writeAudit } from "@/lib/audit";
export const runtime = "nodejs";
const schema = z.object({ token: z.string().min(32).max(128) });
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.emailVerificationToken.findUnique({
        where: { tokenHash: hashVerificationToken(parsed.data.token) },
        select: { id: true, userId: true, expiresAt: true, usedAt: true, user: { select: { emailVerifiedAt: true, status: true } } },
      });
      if (!record || record.usedAt || record.expiresAt <= now || record.user.emailVerifiedAt || record.user.status !== "PENDING") return null;
      const claimed = await tx.emailVerificationToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) return null;
      await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: now, status: "ACTIVE" } });
      await tx.emailVerificationToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: now } });
      return { id: record.userId };
    });
    if (!result) return NextResponse.json({ error: "This verification link is invalid, expired, or already used. Request a new one." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    await writeAudit({ actorId: result.id, action: "auth.email_verified", entityType: "User", entityId: result.id });
    return NextResponse.json({ success: true, message: "Email verified. You can now sign in." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Verification is temporarily unavailable. Please try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
