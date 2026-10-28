import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { LedgerError } from "../services/ledger.js";
import { MoneyError } from "../lib/money.js";
import type { RateLimiter } from "../lib/rate-limit.js";

export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (handler: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
  handler(req, res, next).catch(next);
};

export function requestContext() {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.header("x-request-id") ?? crypto.randomUUID();
    res.setHeader("x-request-id", id);
    (req as Request & { requestId?: string }).requestId = id;
    next();
  };
}

/** Rate limit keyed by authenticated user when present, else by client IP. */
export function rateLimit(limiter: RateLimiter, namespace: string, cost = 1) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.auth?.userId ?? req.ip ?? "anonymous";
    try {
      const result = await limiter.consume(`${namespace}:${key}`, cost);
      res.setHeader("x-ratelimit-remaining", String(result.remaining));
      if (!result.allowed) {
        res.setHeader("retry-after", String(Math.ceil(result.retryAfterMs / 1000)));
        res.status(429).json({ error: "rate_limited", retryAfterMs: result.retryAfterMs });
        return;
      }
      next();
    } catch (error) {
      // Never fail closed on a limiter outage: availability wins, and the
      // incident is surfaced on the log stream.
      console.error("rate_limiter_unavailable", error);
      next();
    }
  };
}

export function notFound() {
  return (_req: Request, res: Response) => res.status(404).json({ error: "not_found" });
}

export function errorHandler() {
  return (error: unknown, req: Request, res: Response, _next: NextFunction) => {
    const requestId = (req as Request & { requestId?: string }).requestId;
    if (error instanceof ZodError) {
      res.status(400).json({ error: "validation_failed", requestId, issues: error.issues });
      return;
    }
    if (error instanceof LedgerError) {
      const status = error.code === "insufficient_funds" ? 409 : error.code === "unbalanced" ? 500 : 422;
      res.status(status).json({ error: error.code, message: error.message, requestId });
      return;
    }
    if (error instanceof MoneyError) {
      res.status(400).json({ error: "invalid_amount", message: error.message, requestId });
      return;
    }
    console.error("unhandled_error", { requestId, error });
    res.status(500).json({ error: "internal_error", requestId });
  };
}
