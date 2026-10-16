import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getNeonAuth } from "@/lib/neon-auth/server";

const COOKIE_NAME = "veltron_session";
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId, tokenHash: digest(token), expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

async function getNeonSessionUser() {
  try {
    const { session, user: neonUser } = await getNeonAuth().getSession();
    if (!session || !neonUser || !neonUser.email || neonUser.emailVerified !== true) return null;

    const email = neonUser.email.toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, status: true, twoFactorEnabled: true, emailVerifiedAt: true },
    });

    if (!user) {
      // Create a local business-profile record for a verified Neon identity.
      // The random password hash is never used for Neon sign-in.
      try {
        const created = await prisma.user.create({
          data: {
            email,
            name: neonUser.name || null,
            passwordHash: await hashPassword(randomBytes(48).toString("base64url")),
            emailVerifiedAt: new Date(),
            status: "ACTIVE",
            walletAccounts: { create: { currency: "NGN" } },
          },
          select: { id: true, email: true, name: true, role: true, status: true, twoFactorEnabled: true, emailVerifiedAt: true },
        });
        user = created;
      } catch {
        // Handle simultaneous first requests without creating duplicate profiles.
        user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, role: true, status: true, twoFactorEnabled: true, emailVerifiedAt: true },
        });
      }
    } else if (!user.emailVerifiedAt && user.status !== "SUSPENDED") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date(), status: "ACTIVE" },
        select: { id: true, email: true, name: true, role: true, status: true, twoFactorEnabled: true, emailVerifiedAt: true },
      });
    }

    // Never infer or elevate business roles from the Neon identity. Existing
    // local suspension and local TOTP protection remain authoritative.
    if (!user || user.status !== "ACTIVE" || user.twoFactorEnabled) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status, twoFactorEnabled: user.twoFactorEnabled };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  if (process.env.NEON_AUTH_ENABLED === "true") return getNeonSessionUser();

  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: digest(token) }, select: { expiresAt: true, revokedAt: true, user: { select: { id: true, email: true, name: true, role: true, status: true, twoFactorEnabled: true } } } });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") return null;
  return session.user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) await prisma.session.updateMany({ where: { tokenHash: digest(token), revokedAt: null }, data: { revokedAt: new Date() } });
  jar.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(0) });
}
