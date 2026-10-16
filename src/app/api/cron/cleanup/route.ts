import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(header: string | null, secret: string): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const supplied = header.slice(7);
  const expectedHash = createHash("sha256").update(secret).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(expectedHash, suppliedHash);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "Scheduled cleanup is not configured." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  if (!authorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const now = new Date();
  const oldTokenCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oldRevocationCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const staleLimitCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  try {
    const [sessions, verificationTokens, rateLimits] = await prisma.$transaction([
      prisma.session.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { revokedAt: { lt: oldRevocationCutoff } },
          ],
        },
      }),
      prisma.emailVerificationToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: oldTokenCutoff } },
            { usedAt: { lt: oldTokenCutoff } },
          ],
        },
      }),
      prisma.authRateLimit.deleteMany({ where: { updatedAt: { lt: staleLimitCutoff } } }),
    ]);
    return NextResponse.json({
      success: true,
      deleted: { sessions: sessions.count, verificationTokens: verificationTokens.count, rateLimits: rateLimits.count },
      completedAt: now.toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Cleanup could not complete." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
