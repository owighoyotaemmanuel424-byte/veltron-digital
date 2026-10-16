import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  template: z.enum(["PORTFOLIO", "BUSINESS", "LANDING_PAGE"]),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const sites = await prisma.hostedSite.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, template: true, domain: true, status: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ sites }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load website drafts." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  }
  let input: unknown;
  try { input = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Enter a site name and choose a template." }, { status: 400 });

  try {
    const site = await prisma.hostedSite.create({
      data: { userId: user.id, name: parsed.data.name, template: parsed.data.template, status: "DRAFT" },
      select: { id: true, name: true, template: true, domain: true, status: true, createdAt: true, updatedAt: true },
    });
    try {
      await writeAudit({ actorId: user.id, action: "website.draft.created", entityType: "HostedSite", entityId: site.id, details: { template: site.template } });
    } catch {
      // The draft is saved; audit-service availability must not make the client retry and create duplicates.
    }
    return NextResponse.json({ site }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not save the website draft." }, { status: 503 });
  }
}
