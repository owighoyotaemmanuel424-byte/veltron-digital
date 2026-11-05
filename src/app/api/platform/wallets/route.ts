import { proxyPlatform } from "@/lib/api/platformProxy";

export const dynamic = "force-dynamic";

/** Available and locked balances for the signed-in platform account. */
export async function GET() {
  return proxyPlatform("/v1/wallets");
}
