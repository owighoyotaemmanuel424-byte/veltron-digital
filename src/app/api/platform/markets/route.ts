import { proxyPlatform } from "@/lib/api/platformProxy";

export const dynamic = "force-dynamic";

/** Public market snapshot: tickers plus the engine's recent closes. */
export async function GET() {
  return proxyPlatform("/v1/markets", { requireAuth: false });
}
