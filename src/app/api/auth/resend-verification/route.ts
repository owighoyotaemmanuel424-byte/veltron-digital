import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueEmailVerification } from "@/lib/email-verification";
import { enforceAuthRateLimit, getClientAddress } from "@/lib/auth-rate-limit";
export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email().max(254) });
const genericMessage = "If an unverified account exists for that email, a new verification link will be sent.";
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  try {
    const allowed = await enforceAuthRateLimit("resend-verification", email, 3, 60 * 60);
    if (!allowed) return NextResponse.json({ error: "Too many requests. Please wait an hour before trying again." }, { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } });
    const ipAllowed = await enforceAuthRateLimit("resend-verification-ip", getClientAddress(request.headers), 15, 60 * 60);
    if (!ipAllowed) return NextResponse.json({ error: "Too many verification requests from this network. Please try again later." }, { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, status: true, emailVerifiedAt: true } });
    if (user && user.status === "PENDING" && !user.emailVerifiedAt) {
      await issueEmailVerification(user.id, user.email, user.name);
    }
    return NextResponse.json({ message: genericMessage }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The request could not be processed. Please try again later." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
