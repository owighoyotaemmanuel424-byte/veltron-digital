import { NextResponse, type NextRequest } from "next/server";
import { getNeonAuth } from "@/lib/neon-auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getHandlers() {
  try {
    return getNeonAuth().handler();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const handlers = getHandlers();
  if (!handlers) {
    return NextResponse.json(
      { error: "Neon Better Auth is not enabled or configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const handlers = getHandlers();
  if (!handlers) {
    return NextResponse.json(
      { error: "Neon Better Auth is not enabled or configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return handlers.POST(request);
}
