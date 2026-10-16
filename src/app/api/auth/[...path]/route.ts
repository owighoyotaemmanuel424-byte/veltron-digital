import { NextResponse, type NextRequest } from "next/server";
import { getNeonAuth } from "@/lib/neon-auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthRouteContext = {
  params: Promise<{ path: string[] }>;
};

function getHandlers() {
  try {
    return getNeonAuth().handler();
  } catch {
    return null;
  }
}

function unavailable() {
  return NextResponse.json(
    { error: "Neon Better Auth is not enabled or configured." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: NextRequest, context: AuthRouteContext) {
  const handlers = getHandlers();
  if (!handlers) return unavailable();
  return handlers.GET(request, context);
}

export async function POST(request: NextRequest, context: AuthRouteContext) {
  const handlers = getHandlers();
  if (!handlers) return unavailable();
  return handlers.POST(request, context);
}
