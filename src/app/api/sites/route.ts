import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const templateSchema = z.enum(["PORTFOLIO", "BUSINESS", "LANDING_PAGE"]);
const siteContentSchema = z.object({
  headline: z.string().trim().min(3).max(120),
  tagline: z.string().trim().max(160),
  description: z.string().trim().min(10).max(1000),
  buttonText: z.string().trim().min(2).max(40),
  sectionOneTitle: z.string().trim().min(2).max(80),
  sectionOneBody: z.string().trim().min(5).max(400),
  sectionTwoTitle: z.string().trim().min(2).max(80),
  sectionTwoBody: z.string().trim().min(5).max(400),
});
const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  template: templateSchema,
});
const updateSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(2).max(80),
  template: templateSchema,
  content: siteContentSchema,
});

function defaultContent(template: string, name: string) {
  if (template === "PORTFOLIO") return {
    headline: "Ideas made with purpose.",
    tagline: "PERSONAL PORTFOLIO",
    description: "A home for selected work, skills, and creative direction.",
    buttonText: "Explore my work",
    sectionOneTitle: "Selected work",
    sectionOneBody: "Show the projects that best represent your craft and experience.",
    sectionTwoTitle: "About me",
    sectionTwoBody: "Share your story, your approach, and what makes your work distinct.",
  };
  if (template === "LANDING_PAGE") return {
    headline: "Make your next move count.",
    tagline: "INTRODUCING SOMETHING NEW",
    description: "A focused message, a clear offer, and one useful next step for your audience.",
    buttonText: "Get started",
    sectionOneTitle: "Why this matters",
    sectionOneBody: "Explain the value your offer brings and who it is designed to help.",
    sectionTwoTitle: "Take the next step",
    sectionTwoBody: "Tell visitors how to learn more, get in touch, or move forward.",
  };
  return {
    headline: "Thoughtful service. Real results.",
    tagline: name.trim() ? `WELCOME TO ${name.trim().toUpperCase()}`.slice(0, 160) : "WELCOME TO OUR BUSINESS",
    description: "A modern online home for your company, services, and customers.",
    buttonText: "Explore services",
    sectionOneTitle: "What we do",
    sectionOneBody: "Introduce your core services and the people or businesses you support.",
    sectionTwoTitle: "Why work with us",
    sectionTwoBody: "Explain your approach, your values, and what customers can expect.",
  };
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return Boolean(origin && new URL(origin).origin === request.nextUrl.origin);
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const sites = await prisma.hostedSite.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, template: true, domain: true, status: true, content: true, createdAt: true, updatedAt: true },
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
  if (!sameOrigin(request)) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  let input: unknown;
  try { input = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Enter a site name and choose a template." }, { status: 400 });
  try {
    const site = await prisma.hostedSite.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        template: parsed.data.template,
        status: "DRAFT",
        content: defaultContent(parsed.data.template, parsed.data.name),
      },
      select: { id: true, name: true, template: true, domain: true, status: true, content: true, createdAt: true, updatedAt: true },
    });
    try {
      await writeAudit({ actorId: user.id, action: "website.draft.created", entityType: "HostedSite", entityId: site.id, details: { template: site.template } });
    } catch { /* Saving a draft must not be retried because auditing is unavailable. */ }
    return NextResponse.json({ site }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not save the website draft." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  let input: unknown;
  try { input = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Check the site name and complete all content fields before saving." }, { status: 400 });
  try {
    const result = await prisma.hostedSite.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: { name: parsed.data.name, template: parsed.data.template, content: parsed.data.content },
    });
    if (!result.count) return NextResponse.json({ error: "Website draft not found." }, { status: 404 });
    const site = await prisma.hostedSite.findFirst({
      where: { id: parsed.data.id, userId: user.id },
      select: { id: true, name: true, template: true, domain: true, status: true, content: true, createdAt: true, updatedAt: true },
    });
    try {
      await writeAudit({ actorId: user.id, action: "website.draft.updated", entityType: "HostedSite", entityId: parsed.data.id, details: { template: parsed.data.template } });
    } catch { /* The saved change remains successful if the audit service is unavailable. */ }
    return NextResponse.json({ site }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not save website changes." }, { status: 503 });
  }
}
