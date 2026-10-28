"use server";

import { revalidatePath } from "next/cache";

import { platformApiBaseUrl } from "@/lib/api/platform";
import { getPlatformSession } from "@/lib/api/session";

export type VaultActionState = { ok?: true; error?: string } | null;

export async function createVaultAction(_previous: VaultActionState, formData: FormData): Promise<VaultActionState> {
  const session = await getPlatformSession();
  if (!session) return { error: "Sign in to create a vault." };

  const baseUrl = platformApiBaseUrl();
  if (!baseUrl) return { error: "The platform API is not configured for this environment." };

  const name = String(formData.get("name") ?? "").trim();
  const apyRate = String(formData.get("apyRate") ?? "").trim();
  const targetAmount = String(formData.get("targetAmount") ?? "").trim();
  const schedule = String(formData.get("schedule") ?? "MONTHLY");
  const productId = String(formData.get("productId") ?? "").trim();

  if (!name) return { error: "Give the vault a name." };
  if (!/^\d+(\.\d{1,2})?$/.test(apyRate)) return { error: "APY must be a number with up to two decimals." };

  try {
    const response = await fetch(`${baseUrl}/v1/vaults`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        name,
        apyRate,
        schedule,
        ...(targetAmount ? { targetAmount } : {}),
        ...(productId ? { productId } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 401) return { error: "Your session expired. Sign in again." };
    if (!response.ok) return { error: "The platform rejected that vault. Check the rate and try again." };
  } catch {
    return { error: "Could not reach the platform API. Try again in a moment." };
  }

  revalidatePath("/savings");
  return { ok: true };
}
