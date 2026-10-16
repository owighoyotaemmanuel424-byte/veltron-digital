import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";
export async function POST() {
  try { await destroySession(); return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "Could not end this session." }, { status: 503 }); }
}
