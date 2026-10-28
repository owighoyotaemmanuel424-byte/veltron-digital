"use server";

import { redirect } from "next/navigation";

import { platformApiBaseUrl } from "@/lib/api/platform";
import { clearPlatformSession, setPlatformSession } from "@/lib/api/session";

export type SignInState = { error: string } | null;

type LoginResponse = {
  user?: { id: string; email: string; role: "USER" | "ADMIN" | "SUPER_ADMIN" };
  accessToken?: string;
  refreshToken?: string;
  error?: string;
};

const ERROR_COPY: Record<string, string> = {
  invalid_credentials: "That email and password combination is not recognised.",
  totp_required: "This account requires a 6-digit authenticator code.",
  invalid_totp: "That verification code is not valid. Try the current code.",
  rate_limited: "Too many attempts. Wait a moment and try again.",
};

export async function signInAction(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const totp = String(formData.get("totp") ?? "").trim();

  if (!email.includes("@") || password.length < 1) {
    return { error: "Enter a valid email address and your password." };
  }

  const baseUrl = platformApiBaseUrl();
  if (!baseUrl) {
    return { error: "The platform API is not configured for this environment (PLATFORM_API_URL)." };
  }

  let payload: LoginResponse;
  try {
    const response = await fetch(`${baseUrl}/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email, password, ...(totp ? { totp } : {}) }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    payload = (await response.json().catch(() => ({}))) as LoginResponse;
    if (!response.ok || !payload.accessToken || !payload.user) {
      return { error: ERROR_COPY[payload.error ?? ""] ?? "Sign-in failed. Check your credentials and try again." };
    }
  } catch {
    return { error: "Could not reach the platform API. Try again in a moment." };
  }

  await setPlatformSession({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken ?? "",
    email: payload.user.email,
    role: payload.user.role,
    userId: payload.user.id,
  });

  // `redirect` throws by design, so it must sit outside the try/catch above.
  redirect("/savings");
}

export async function signOutAction(): Promise<void> {
  await clearPlatformSession();
  redirect("/login");
}
