import { catalogResponse } from "@/lib/catalog/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ category: string }> }) {
  const { category } = await context.params;
  return catalogResponse(category);
}
