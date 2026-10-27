import { catalogResponse } from "@/lib/catalog/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return catalogResponse(); }
