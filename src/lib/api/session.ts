import { cookies } from "next/headers";

/**
 * Server-side platform session. Tokens live in an httpOnly cookie so they are
 * never readable from the browser, and every server component/action reads them
 * through this module only.
 */

const COOKIE_NAME = "veltron_platform_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type PlatformSession = {
  accessToken: string;
  refreshToken: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  userId: string;
};

export async function getPlatformSession(): Promise<PlatformSession | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PlatformSession>;
    if (!parsed.accessToken || !parsed.email || !parsed.userId) return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken ?? "",
      email: parsed.email,
      role: (parsed.role as PlatformSession["role"]) ?? "USER",
      userId: parsed.userId,
    };
  } catch {
    return null;
  }
}

export async function setPlatformSession(session: PlatformSession): Promise<void> {
  (await cookies()).set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearPlatformSession(): Promise<void> {
  (await cookies()).set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}
