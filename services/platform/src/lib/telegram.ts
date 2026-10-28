import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

/**
 * Telegram bot webhook authentication.
 *
 * Two independent checks run before a webhook body is trusted:
 *  1. A HMAC-SHA256 signature over the raw request body (`x-telegram-signature`),
 *     so tampering with the payload invalidates the signature.
 *  2. Telegram's own `x-telegram-bot-api-secret-token` header, compared to the
 *     configured secret in constant time.
 */

export function signWebhookBody(secret: string, rawBody: Buffer | string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyWebhookSignature(secret: string, rawBody: Buffer | string, signature: string | undefined): boolean {
  if (!signature) return false;
  const expected = Buffer.from(signWebhookBody(secret, rawBody), "hex");
  const provided = Buffer.from(signature.trim().toLowerCase(), "hex");
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export function verifySecretToken(secret: string, provided: string | undefined): boolean {
  if (!provided) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createTelegramWebhookGuard(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    const signature = req.header("x-telegram-signature");
    const secretToken = req.header("x-telegram-bot-api-secret-token");

    if (!raw || !verifyWebhookSignature(secret, raw, signature) || !verifySecretToken(secret, secretToken)) {
      res.status(401).json({ error: "invalid_telegram_signature" });
      return;
    }
    next();
  };
}
