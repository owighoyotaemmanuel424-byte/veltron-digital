import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(["LETTER", "BUSINESS_NOTE", "SERVICE_SUMMARY"]),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(12000),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const documents = await prisma.generatedDocument.findMany({
      where: { userId: user.id },
      select: { id: true, kind: true, title: true, status: true, content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ documents }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load documents." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a document type and provide a title and body." }, { status: 400 });

  try {
    const document = await prisma.generatedDocument.create({
      data: {
        userId: user.id,
        kind: parsed.data.kind,
        title: parsed.data.title,
        status: "DRAFT",
        content: {
          body: parsed.data.body,
          createdFor: user.email,
          createdAt: new Date().toISOString(),
          disclaimer: "User-created draft. Not proof of payment, identity, bank balance, or third-party certification.",
        },
      },
      select: { id: true, kind: true, title: true, status: true, content: true, createdAt: true },
    });
    await writeAudit({ actorId: user.id, action: "document.draft.created", entityType: "GeneratedDocument", entityId: document.id, details: { kind: document.kind } });
    return NextResponse.json({ document }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not save the document draft." }, { status: 503 });
  }
}
