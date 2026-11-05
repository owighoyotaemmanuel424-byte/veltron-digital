import { NextResponse } from "next/server";

import { platformApiBaseUrl } from "@/lib/api/platform";
import { getPlatformSession } from "@/lib/api/session";

/**
 * Server-side bridge to the platform API.
 *
 * The session token lives in an httpOnly cookie, so the browser cannot attach
 * `Authorization` itself. Every trading call is relayed from these route
 * handlers, which read the token on the server and never expose it.
 *
 * Failure modes are explicit rather than masked: an unconfigured API, a missing
 * session and an unreachable upstream each return a distinct status so the UI
 * can say what is actually wrong.
 */

const UNAVAILABLE = { "cache-control": "private, no-store" } as const;

export function platformUnconfigured() {
  return NextResponse.json(
    { error: "platform_unconfigured", message: "PLATFORM_API_URL is not configured for this deployment." },
    { status: 503, headers: UNAVAILABLE },
  );
}

type ProxyOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  /** Market data is public; wallets and orders are per-user. */
  requireAuth?: boolean;
};

export async function proxyPlatform(path: string, options: ProxyOptions = {}) {
  const baseUrl = platformApiBaseUrl();
  if (!baseUrl) return platformUnconfigured();

  let accessToken: string | undefined;
  if (options.requireAuth !== false) {
    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json(
        { error: "not_signed_in", message: "Sign in to a platform account to view balances and orders." },
        { status: 401, headers: UNAVAILABLE },
      );
    }
    accessToken = session.accessToken;
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        accept: "application/json",
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const text = await response.text();
    let payload: unknown = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { error: "invalid_upstream_response", message: text.slice(0, 200) };
      }
    }
    return NextResponse.json(payload as Record<string, unknown>, {
      status: response.status,
      headers: UNAVAILABLE,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "platform_unreachable",
        message: error instanceof Error ? error.message : "The platform API could not be reached.",
      },
      { status: 502, headers: UNAVAILABLE },
    );
  }
}
