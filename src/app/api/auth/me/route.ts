import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
