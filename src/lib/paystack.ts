import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const initializeSchema = z.object({
  email: z.string().email(),
  amountMinor: z.number().int().positive(),
  reference: z.string().min(8).max(100),
  callbackUrl: z.string().url()
});

export class PaystackNotConfiguredError extends Error {
  constructor() { super("Paystack is disabled until merchant eligibility and credentials are configured."); }
}
function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new PaystackNotConfiguredError();
  return key;
}
export async function initializePaystackPayment(input: z.infer<typeof initializeSchema>) {
  const data = initializeSchema.parse(input);
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${getSecretKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: data.email, amount: data.amountMinor, reference: data.reference, callback_url: data.callbackUrl }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status !== true || !payload?.data?.authorization_url) {
    throw new Error("Payment provider initialization failed.");
  }
  return { authorizationUrl: String(payload.data.authorization_url), reference: String(payload.data.reference) };
}
export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", key).update(rawBody).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}
export async function verifyPaystackTransaction(reference: string) {
  if (!/^[A-Za-z0-9._-]{8,100}$/.test(reference)) throw new Error("Invalid payment reference.");
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${getSecretKey()}` }, cache: "no-store", signal: AbortSignal.timeout(12_000)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status !== true || !payload?.data) throw new Error("Payment verification failed.");
  return payload.data as { status: string; reference: string; amount: number; currency: string; id: number; paid_at?: string; customer?: { email?: string } };
}
