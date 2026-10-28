import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import type { Config } from "../config.js";
import { prisma } from "../db.js";
import { asyncHandler, rateLimit } from "../http/middleware.js";
import { createAuthMiddleware, requireRole } from "../lib/jwt.js";
import { formatAmount, parseAmount } from "../lib/money.js";
import type { RateLimiter } from "../lib/rate-limit.js";
import { postTransaction, systemAccountKey, walletAccountKey } from "../services/ledger.js";

const adjustmentSchema = z.object({
  userId: z.string().uuid(),
  currency: z.string().regex(/^[A-Z0-9]{2,10}$/).default("USD"),
  amount: z.string().regex(/^\d+(\.\d{1,8})?$/),
  direction: z.enum(["CREDIT", "DEBIT"]),
  reason: z.string().min(3).max(255),
});

const kycReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().max(512).optional(),
});

export function createAdminRouter(config: Config, limiter: RateLimiter): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(config.jwtSecret);
  const adminLimit = rateLimit(limiter, "admin", 1);

  router.use(requireAuth, requireRole("ADMIN"), adminLimit);

  router.get(
    "/users",
    asyncHandler(async (req, res) => {
      const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const users = await prisma.user.findMany({
        where: query ? { email: { contains: query, mode: "insensitive" } } : undefined,
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          kycStatus: true,
          createdAt: true,
          wallets: { select: { currencyCode: true, balance: true, lockedBalance: true } },
        },
      });
      res.json({ users });
    }),
  );

  router.post(
    "/adjustments",
    asyncHandler(async (req, res) => {
      const input = adjustmentSchema.parse(req.body);
      const wallet = await prisma.wallet.findUnique({
        where: { unique_user_currency: { userId: input.userId, currencyCode: input.currency } },
        select: { id: true },
      });
      if (!wallet) {
        res.status(404).json({ error: "wallet_not_found" });
        return;
      }

      const major = parseAmount(input.amount);
      const signed = input.direction === "CREDIT" ? major : -major;
      const reference = `adjustment:${crypto.randomUUID()}`;

      await prisma.$transaction(async (tx) => {
        // Manual adjustments post against a dedicated system account so the
        // reason and the actor stay attached to an immutable ledger group.
        await postTransaction(tx, {
          reference,
          description: `${input.direction} adjustment — ${input.reason}`,
          postings: [
            { accountKey: walletAccountKey(wallet.id), currencyCode: input.currency, amount: formatAmount(signed) },
            {
              accountKey: systemAccountKey("manual-adjustments"),
              currencyCode: input.currency,
              amount: formatAmount(-signed),
            },
          ],
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: input.direction,
            amount: new Prisma.Decimal(input.amount),
            referenceId: reference,
          },
        });
      });

      res.status(201).json({ reference, direction: input.direction, amount: input.amount, currency: input.currency });
    }),
  );

  router.get(
    "/kyc",
    asyncHandler(async (req, res) => {
      const status = typeof req.query.status === "string" ? req.query.status : "PENDING";
      const documents = await prisma.kycDocument.findMany({
        where: { status: status as "PENDING" | "APPROVED" | "REJECTED" },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { user: { select: { email: true, role: true } } },
      });
      res.json({ documents });
    }),
  );

  router.post(
    "/kyc/:id/review",
    asyncHandler(async (req, res) => {
      const input = kycReviewSchema.parse(req.body);
      const document = await prisma.kycDocument.findUnique({
        where: { id: req.params.id },
        select: { id: true, userId: true, status: true },
      });
      if (!document) {
        res.status(404).json({ error: "document_not_found" });
        return;
      }
      if (document.status !== "PENDING") {
        res.status(409).json({ error: "already_reviewed" });
        return;
      }

      const [updated] = await prisma.$transaction([
        prisma.kycDocument.update({
          where: { id: document.id },
          data: {
            status: input.decision,
            reviewedBy: req.auth!.userId,
            reviewedAt: new Date(),
            notes: input.notes ?? null,
          },
        }),
        prisma.user.update({
          where: { id: document.userId },
          data: { kycStatus: input.decision },
        }),
      ]);

      res.json({ document: updated });
    }),
  );

  router.patch(
    "/catalog/:id",
    asyncHandler(async (req, res) => {
      const input = z
        .object({
          feeRate: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
          apyRate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
          isActive: z.boolean().optional(),
        })
        .parse(req.body);
      const product = await prisma.catalogProduct.update({
        where: { id: req.params.id },
        data: {
          ...(input.feeRate ? { feeRate: new Prisma.Decimal(input.feeRate) } : {}),
          ...(input.apyRate ? { apyRate: new Prisma.Decimal(input.apyRate) } : {}),
          ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
        },
      });
      res.json({ product });
    }),
  );

  return router;
}
