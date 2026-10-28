import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import type { Config } from "../config.js";
import { prisma } from "../db.js";
import { asyncHandler } from "../http/middleware.js";
import { createAuthMiddleware } from "../lib/jwt.js";
import { applyRate, formatAmount, parseAmount } from "../lib/money.js";
import type { RateLimiter } from "../lib/rate-limit.js";
import { lockFunds, postTransaction, releaseFunds, systemAccountKey, walletAccountKey } from "../services/ledger.js";
import type { MarketEngine } from "../realtime/engine.js";
import { rateLimit } from "../http/middleware.js";

const amountSchema = z.string().regex(/^\d+(\.\d{1,8})?$/, "amount must be a positive decimal");

const currencySchema = z.string().regex(/^[A-Z0-9]{2,10}$/).default("USD");

const orderSchema = z.object({
  symbol: z.string().min(2).max(12),
  side: z.enum(["BUY", "SELL"]),
  kind: z.enum(["MARKET", "LIMIT"]),
  quantity: z.string().regex(/^\d+(\.\d{1,8})?$/),
  price: z.string().regex(/^\d+(\.\d{1,8})?$/).optional(),
});

const vaultSchema = z.object({
  name: z.string().min(1).max(120),
  productId: z.string().uuid().optional(),
  apyRate: z.string().regex(/^\d+(\.\d{1,2})?$/),
  targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  schedule: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).default("MONTHLY"),
  recurringCron: z.string().max(50).optional(),
});

async function requireWallet(userId: string, currency: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { unique_user_currency: { userId, currencyCode: currency } },
    select: { id: true, balance: true, lockedBalance: true },
  });
  if (!wallet) {
    const created = await prisma.wallet.create({
      data: { userId, currencyCode: currency },
      select: { id: true, balance: true, lockedBalance: true },
    });
    return created;
  }
  return wallet;
}

export function createPlatformRouter(config: Config, limiter: RateLimiter, engine: MarketEngine): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(config.jwtSecret);
  const apiLimit = rateLimit(limiter, "api", 1);
  const tradeLimit = rateLimit(limiter, "trades", 1);

  // --- Catalog ---------------------------------------------------------------
  router.get(
    "/catalog",
    asyncHandler(async (req, res) => {
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const search = typeof req.query.q === "string" ? req.query.q : undefined;
      const products = await prisma.catalogProduct.findMany({
        where: {
          isActive: true,
          ...(category ? { category } : {}),
          ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      res.json({ products });
    }),
  );

  // --- Wallets ---------------------------------------------------------------
  router.get(
    "/wallets",
    requireAuth,
    apiLimit,
    asyncHandler(async (req, res) => {
      const wallets = await prisma.wallet.findMany({
        where: { userId: req.auth!.userId },
        orderBy: { currencyCode: "asc" },
        select: { id: true, currencyCode: true, balance: true, lockedBalance: true, updatedAt: true },
      });
      res.json({
        wallets,
        // Sum of available balances expressed in USD minor units, treats USD and
        // USDT 1:1 for the demo portfolio summary.
        totalUsd: wallets
          .filter((wallet) => wallet.currencyCode === "USD" || wallet.currencyCode === "USDT")
          .reduce((total, wallet) => total + wallet.balance.toNumber(), 0)
          .toFixed(2),
      });
    }),
  );

  router.post(
    "/wallets/deposit",
    requireAuth,
    apiLimit,
    asyncHandler(async (req, res) => {
      const { currency, amount } = z.object({ currency: currencySchema, amount: amountSchema }).parse(req.body);
      const wallet = await requireWallet(req.auth!.userId, currency);
      const reference = `deposit:${crypto.randomUUID()}`;

      await prisma.$transaction(async (tx) => {
        await postTransaction(tx, {
          reference,
          description: `Deposit ${amount} ${currency}`,
          postings: [
            { accountKey: walletAccountKey(wallet.id), currencyCode: currency, amount },
            { accountKey: systemAccountKey("external-fiat"), currencyCode: currency, amount: `-${amount}` },
          ],
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: new Prisma.Decimal(amount),
            referenceId: reference,
          },
        });
      });

      res.status(201).json({ reference, currency, amount });
    }),
  );

  router.post(
    "/wallets/withdraw",
    requireAuth,
    apiLimit,
    asyncHandler(async (req, res) => {
      const { currency, amount } = z.object({ currency: currencySchema, amount: amountSchema }).parse(req.body);
      const wallet = await requireWallet(req.auth!.userId, currency);
      const grossMinor = parseAmount(amount);
      const feeMinor = applyRate(grossMinor, "0.0015");
      const netMinor = grossMinor - feeMinor;
      if (netMinor <= 0n) {
        res.status(422).json({ error: "invalid_amount", message: "Amount is too small after fees" });
        return;
      }
      const reference = `withdrawal:${crypto.randomUUID()}`;

      await prisma.$transaction(async (tx) => {
        await postTransaction(tx, {
          reference,
          description: `Withdrawal ${amount} ${currency} (fee ${formatAmount(feeMinor)})`,
          postings: [
            { accountKey: walletAccountKey(wallet.id), currencyCode: currency, amount: formatAmount(-grossMinor) },
            { accountKey: systemAccountKey("external-fiat"), currencyCode: currency, amount: formatAmount(netMinor) },
            { accountKey: systemAccountKey("fee-income"), currencyCode: currency, amount: formatAmount(feeMinor) },
          ],
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "DEBIT",
            amount: new Prisma.Decimal(amount),
            fee: new Prisma.Decimal(formatAmount(feeMinor)),
            referenceId: reference,
          },
        });
      });

      res.status(201).json({ reference, currency, amount, fee: formatAmount(feeMinor), net: formatAmount(netMinor) });
    }),
  );

  // --- Savings vaults --------------------------------------------------------
  router.get(
    "/vaults",
    requireAuth,
    apiLimit,
    asyncHandler(async (req, res) => {
      const vaults = await prisma.savingsVault.findMany({
        where: { userId: req.auth!.userId },
        orderBy: { createdAt: "desc" },
        include: { product: { select: { name: true, category: true } } },
      });
      res.json({ vaults });
    }),
  );

  router.post(
    "/vaults",
    requireAuth,
    apiLimit,
    asyncHandler(async (req, res) => {
      const input = vaultSchema.parse(req.body);
      const vault = await prisma.savingsVault.create({
        data: {
          userId: req.auth!.userId,
          productId: input.productId ?? null,
          name: input.name,
          apyRate: new Prisma.Decimal(input.apyRate),
          targetAmount: input.targetAmount ? new Prisma.Decimal(input.targetAmount) : null,
          schedule: input.schedule,
          recurringCron: input.recurringCron ?? null,
        },
      });
      res.status(201).json({ vault });
    }),
  );

  router.post(
    "/vaults/:id/deposit",
    requireAuth,
    apiLimit,
    asyncHandler(async (req, res) => {
      const { amount, currency } = z.object({ amount: amountSchema, currency: currencySchema }).parse(req.body);
      const vault = await prisma.savingsVault.findFirst({
        where: { id: String(req.params.id), userId: req.auth!.userId },
        select: { id: true },
      });
      if (!vault) {
        res.status(404).json({ error: "vault_not_found" });
        return;
      }
      const wallet = await requireWallet(req.auth!.userId, currency);
      const reference = `vault-deposit:${crypto.randomUUID()}`;

      await prisma.$transaction(async (tx) => {
        await postTransaction(tx, {
          reference,
          description: `Vault deposit ${amount} ${currency}`,
          postings: [
            { accountKey: walletAccountKey(wallet.id), currencyCode: currency, amount: formatAmount(-parseAmount(amount)) },
            { accountKey: systemAccountKey("vault-escrow"), currencyCode: currency, amount },
          ],
        });
        await tx.savingsVault.update({
          where: { id: vault.id },
          data: { currentBalance: { increment: new Prisma.Decimal(amount) } },
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "SAVINGS_DEPOSIT",
            amount: new Prisma.Decimal(amount),
            referenceId: reference,
          },
        });
      });

      res.status(201).json({ reference, amount, currency });
    }),
  );

  // --- Orders ----------------------------------------------------------------
  router.get(
    "/orders",
    requireAuth,
    apiLimit,
    asyncHandler(async (req, res) => {
      res.json({ orders: engine.openOrders(req.auth!.userId), tickers: engine.tickers() });
    }),
  );

  router.post(
    "/orders",
    requireAuth,
    tradeLimit,
    asyncHandler(async (req, res) => {
      const input = orderSchema.parse(req.body);
      const ticker = engine.ticker(input.symbol);
      if (!ticker.price) {
        res.status(404).json({ error: "unknown_symbol" });
        return;
      }
      const price = input.kind === "MARKET" ? ticker.price : Number(input.price ?? ticker.price);
      const quantityMinor = parseAmount(input.quantity);
      const wallet = await requireWallet(req.auth!.userId, "USD");

      // Buy orders reserve quote currency; sell orders reserve the base asset.
      if (input.side === "BUY") {
        const costMinor = applyRate(quantityMinor, price.toFixed(8));
        await prisma.$transaction(async (tx) => lockFunds(tx, wallet.id, costMinor));
      }

      const order = engine.placeOrder({
        userId: req.auth!.userId,
        symbol: input.symbol.toUpperCase(),
        side: input.side,
        kind: input.kind,
        price,
        quantity: Number(input.quantity),
      });

      res.status(201).json({ order, ticker });
    }),
  );

  router.delete(
    "/orders/:id",
    requireAuth,
    tradeLimit,
    asyncHandler(async (req, res) => {
      const cancelled = engine.cancelOrder(String(req.params.id));
      if (!cancelled || cancelled.userId !== req.auth!.userId) {
        res.status(404).json({ error: "order_not_found" });
        return;
      }
      if (cancelled.side === "BUY") {
        const wallet = await requireWallet(req.auth!.userId, "USD");
        const costMinor = applyRate(parseAmount(String(cancelled.quantity)), cancelled.price.toFixed(8));
        await prisma.$transaction(async (tx) => releaseFunds(tx, wallet.id, costMinor));
      }
      res.json({ order: cancelled });
    }),
  );

  return router;
}
