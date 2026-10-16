import { createHmac, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Durable, cross-instance fixed-window limiter backed by PostgreSQL.
 * The identifier is HMACed so raw email addresses are never stored in the table.
 */
export async function enforceAuthRateLimit(
  action: "login" | "register",
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  const key = createHmac("sha256", secret)
    .update(`${action}:${identifier.trim().toLowerCase()}`)
    .digest("hex");

  const rows = await prisma.$queryRaw<Array<{ attempts: number }>>`
    INSERT INTO "AuthRateLimit" ("id", "key", "attempts", "windowStart", "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${key}, 1, NOW(), NOW(), NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "attempts" = CASE
        WHEN "AuthRateLimit"."windowStart" <= NOW() - (${windowSeconds} * INTERVAL '1 second') THEN 1
        ELSE "AuthRateLimit"."attempts" + 1
      END,
      "windowStart" = CASE
        WHEN "AuthRateLimit"."windowStart" <= NOW() - (${windowSeconds} * INTERVAL '1 second') THEN NOW()
        ELSE "AuthRateLimit"."windowStart"
      END,
      "updatedAt" = NOW()
    RETURNING "attempts"
  `;
  return (rows[0]?.attempts ?? limit + 1) <= limit;
}
