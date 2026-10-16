import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Neon Managed Better Auth is deliberately opt-in until the existing local
 * user/role model has been reconciled with Neon identities.
 */
export function getNeonAuth() {
  if (process.env.NEON_AUTH_ENABLED !== "true") {
    throw new Error("Neon Better Auth is not enabled.");
  }

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !cookieSecret || cookieSecret.length < 32) {
    throw new Error("Neon Better Auth is not configured.");
  }

  return createNeonAuth({
    baseUrl,
    cookies: {
      secret: cookieSecret,
      sessionDataTtl: 60,
    },
  });
}
