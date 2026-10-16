import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { encryptTotpSecret, generateTotpSecret, totpUri } from "@/lib/totp";
export const runtime = "nodejs";
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const secret = generateTotpSecret();
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: encryptTotpSecret(secret), twoFactorEnabled: false } });
    return NextResponse.json({ secret, otpauthUrl: totpUri(user.email, secret) }, { headers: { "Cache-Control": "no-store", "Pragma": "no-cache" } });
  } catch {
    return NextResponse.json({ error: "Two-factor setup is unavailable. Check AUTH_SECRET configuration." }, { status: 503 });
  }
}
