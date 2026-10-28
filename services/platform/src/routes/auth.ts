import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";

import type { Config } from "../config.js";
import { prisma } from "../db.js";
import { asyncHandler, rateLimit } from "../http/middleware.js";
import { createAuthMiddleware, signAccessToken, signRefreshToken, verifyToken, type RefreshClaims } from "../lib/jwt.js";
import { createTelegramWebhookGuard, signWebhookBody } from "../lib/telegram.js";
import { createTotpSecret, verifyTotp } from "../lib/totp.js";
import type { RateLimiter } from "../lib/rate-limit.js";
import { systemAccountKey, walletAccountKey } from "../services/ledger.js";

const credentials = z.object({
  email: z.string().email().max(255),
  password: z.string().min(10).max(200),
});

const loginSchema = credentials.extend({ totp: z.string().length(6).optional() });
const enrollSchema = z.object({ totp: z.string().length(6), telegramChatId: z.string().max(100).optional() });

const issuer = "Veltron";

export function createAuthRouter(config: Config, authLimiter: RateLimiter): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(config.jwtSecret);
  const authLimit = rateLimit(authLimiter, "auth");

  const tokensFor = (user: { id: string; email: string; role: "USER" | "ADMIN" | "SUPER_ADMIN" }) => ({
    accessToken: signAccessToken(config.jwtSecret, config.jwtAccessTtl, { sub: user.id, email: user.email, role: user.role }),
    refreshToken: signRefreshToken(config.jwtSecret, config.jwtRefreshTtl, user.id),
    tokenType: "Bearer" as const,
    expiresIn: config.jwtAccessTtl,
  });

  router.post(
    "/register",
    authLimit,
    asyncHandler(async (req, res) => {
      const { email, password } = credentials.parse(req.body);
      const normalized = email.toLowerCase();

      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email: normalized, passwordHash: await bcrypt.hash(password, 10) },
          select: { id: true, email: true, role: true },
        });
        // Opening wallets, funded by the external system account so the ledger
        // stays balanced from the first transaction onward.
        for (const currency of ["USD", "USDT"]) {
          const wallet = await tx.wallet.create({
            data: { userId: user.id, currencyCode: currency },
            select: { id: true },
          });
          await tx.ledgerTransaction.create({
            data: {
              reference: `wallet-open:${wallet.id}`,
              description: `Opening balance for ${currency} wallet`,
              postings: {
                create: [
                  { accountKey: walletAccountKey(wallet.id), currencyCode: currency, amount: 0 },
                  { accountKey: systemAccountKey("external-fiat"), currencyCode: currency, amount: 0 },
                ],
              },
            },
          });
        }
        return user;
      });

      res.status(201).json({ user: created, ...tokensFor(created) });
    }),
  );

  router.post(
    "/login",
    authLimit,
    asyncHandler(async (req, res) => {
      const { email, password, totp } = loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, email: true, role: true, passwordHash: true, telegram2faSecret: true },
      });
      // Constant-ish work on unknown users keeps timing comparable.
      const stored = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
      const valid = await bcrypt.compare(password, stored);
      if (!user || !valid) {
        res.status(401).json({ error: "invalid_credentials" });
        return;
      }
      if (user.telegram2faSecret) {
        if (!totp) {
          res.status(401).json({ error: "totp_required" });
          return;
        }
        if (!verifyTotp(user.telegram2faSecret, totp)) {
          res.status(401).json({ error: "invalid_totp" });
          return;
        }
      }
      res.json({ user: { id: user.id, email: user.email, role: user.role }, ...tokensFor(user) });
    }),
  );

  router.post(
    "/refresh",
    asyncHandler(async (req, res) => {
      const { refreshToken } = z.object({ refreshToken: z.string().min(10) }).parse(req.body);
      const claims = verifyToken<RefreshClaims>(config.jwtSecret, refreshToken);
      if (claims.typ !== "refresh") {
        res.status(401).json({ error: "invalid_token_type" });
        return;
      }
      const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true, email: true, role: true } });
      if (!user) {
        res.status(401).json({ error: "unknown_user" });
        return;
      }
      res.json(tokensFor(user));
    }),
  );

  // --- Telegram TOTP pairing -------------------------------------------------

  router.post(
    "/2fa/enroll",
    requireAuth,
    authLimit,
    asyncHandler(async (req, res) => {
      const secret = createTotpSecret();
      await prisma.user.update({ where: { id: req.auth!.userId }, data: { telegram2faSecret: secret } });
      const label = encodeURIComponent(`${issuer}:${req.auth!.email}`);
      res.json({
        secret,
        otpauthUrl: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`,
      });
    }),
  );

  router.post(
    "/2fa/confirm",
    requireAuth,
    authLimit,
    asyncHandler(async (req, res) => {
      const { totp, telegramChatId } = enrollSchema.parse(req.body);
      const user = await prisma.user.findUnique({
        where: { id: req.auth!.userId },
        select: { telegram2faSecret: true },
      });
      if (!user?.telegram2faSecret) {
        res.status(409).json({ error: "enrolment_not_started" });
        return;
      }
      if (!verifyTotp(user.telegram2faSecret, totp)) {
        res.status(401).json({ error: "invalid_totp" });
        return;
      }
      await prisma.user.update({
        where: { id: req.auth!.userId },
        data: { telegram2faId: telegramChatId ?? null },
      });
      res.json({ enabled: true });
    }),
  );

  router.delete(
    "/2fa",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { totp } = z.object({ totp: z.string().length(6) }).parse(req.body);
      const user = await prisma.user.findUnique({ where: { id: req.auth!.userId }, select: { telegram2faSecret: true } });
      if (!user?.telegram2faSecret || !verifyTotp(user.telegram2faSecret, totp)) {
        res.status(401).json({ error: "invalid_totp" });
        return;
      }
      await prisma.user.update({ where: { id: req.auth!.userId }, data: { telegram2faSecret: null, telegram2faId: null } });
      res.json({ enabled: false });
    }),
  );

  // --- Telegram bot webhook (HMAC + secret token verified) -------------------

  router.post(
    "/telegram/webhook",
    createTelegramWebhookGuard(config.telegramWebhookSecret),
    asyncHandler(async (req, res) => {
      const update = z
        .object({
          update_id: z.number(),
          message: z
            .object({
              chat: z.object({ id: z.union([z.number(), z.string()]) }),
              text: z.string().optional(),
            })
            .optional(),
        })
        .parse(req.body);

      const chatId = update.message?.chat.id;
      const text = update.message?.text ?? "";
      // The bot only acknowledges and stores the pairing handshake; anything
      // financial must go through the authenticated REST API.
      if (chatId !== undefined && /^\/start/.test(text)) {
        await prisma.user.updateMany({
          where: { telegram2faId: String(chatId) },
          data: { isVerified: true },
        });
      }
      res.json({ ok: true });
    }),
  );

  return router;
}

/** Utility used by the Telegram setup screen to show a sample signature. */
export function sampleSignature(config: Config, body: string): string {
  return signWebhookBody(config.telegramWebhookSecret, body);
}
