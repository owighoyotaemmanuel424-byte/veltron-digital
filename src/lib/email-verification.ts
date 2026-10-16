import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueEmailVerification(userId: string, email: string, name: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;
  if (!apiKey || !from || !appUrl) throw new Error("Email verification delivery is not configured.");
  const base = new URL(appUrl);
  if (process.env.NODE_ENV === "production" && base.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production.");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId, usedAt: null } }),
    prisma.emailVerificationToken.create({
      data: { userId, tokenHash: hashVerificationToken(token), expiresAt },
    }),
  ]);

  const verifyUrl = new URL("/verify-email", base);
  verifyUrl.searchParams.set("token", token);
  const htmlEntities: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  const safeName = (name ?? "there").replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Verify your Veltron Digital email",
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717;max-width:560px;margin:auto"><h1>Verify your email</h1><p>Hello ${safeName},</p><p>Confirm this email address to activate your Veltron Digital account. This link expires in 24 hours and can be used once.</p><p><a href="${verifyUrl.toString()}" style="display:inline-block;padding:12px 18px;background:#171717;color:#fff;text-decoration:none;border-radius:8px">Verify email</a></p><p>If you did not create this account, you can ignore this message.</p></div>`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    await prisma.emailVerificationToken.deleteMany({ where: { userId, tokenHash: hashVerificationToken(token) } });
    throw new Error("Verification email could not be sent.");
  }
}
