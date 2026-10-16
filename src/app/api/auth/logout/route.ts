import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";
import { getNeonAuth } from "@/lib/neon-auth/server";

export async function POST() {
  try {
    if (process.env.NEON_AUTH_ENABLED === "true") {
      await getNeonAuth().signOut();
      return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
    }
    await destroySession();
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not end this session." }, { status: 503 });
  }
}
