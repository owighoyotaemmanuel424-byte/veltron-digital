import http from "node:http";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import IORedis from "ioredis";

import { loadConfig, type Config } from "./config.js";
import { prisma } from "./db.js";
import { errorHandler, notFound, requestContext } from "./http/middleware.js";
import { MemoryRateLimiter, RedisRateLimiter, defaultLimits, type RateLimiter } from "./lib/rate-limit.js";
import { createAdminRouter } from "./routes/admin.js";
import { createAuthRouter } from "./routes/auth.js";
import { createPlatformRouter } from "./routes/platform.js";
import { MarketEngine } from "./realtime/engine.js";
import { attachRealtimeServer } from "./realtime/server.js";

/**
 * API gateway: REST + WebSocket on one port behind Nginx.
 *
 *  - helmet for security headers, CORS pinned to the configured frontend origin
 *  - JSON body parsing that keeps the raw buffer for Telegram HMAC verification
 *  - Redis token-bucket limits (in-memory fallback when REDIS_URL is absent)
 *  - shared MarketEngine instance feeding both REST reads and the WS stream
 */
export function buildApp(config: Config, limiter: RateLimiter, engine: MarketEngine): Express {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
        callback(new Error("origin_not_allowed"));
      },
      credentials: true,
    }),
  );
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buffer) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
      },
    }),
  );
  app.use(requestContext());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), symbols: engine.symbols() });
  });

  app.get("/ready", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "unavailable", dependency: "postgres" });
    }
  });

  app.use("/v1/auth", createAuthRouter(config, limiter));
  app.use("/v1", createPlatformRouter(config, limiter, engine));
  app.use("/v1/admin", createAdminRouter(config, limiter));

  app.use(notFound());
  app.use(errorHandler());
  return app;
}

async function main() {
  const config = loadConfig();
  const limits = defaultLimits();
  const redis = config.redisUrl ? new IORedis(config.redisUrl, { maxRetriesPerRequest: null }) : null;
  const limiter: RateLimiter = redis
    ? new RedisRateLimiter(redis, limits.api, "veltron:api")
    : new MemoryRateLimiter(limits.api);

  if (!redis) console.warn("[api] REDIS_URL not set — using in-memory rate limiting");

  const engine = new MarketEngine(config.engineSymbols, config.engineTickMs);
  const app = buildApp(config, limiter, engine);
  const server = http.createServer(app);
  const realtime = attachRealtimeServer(server, engine);

  engine.start();
  server.listen(config.port, () => {
    console.log(`[api] listening on :${config.port} (ws /ws, ${config.engineSymbols.length} symbols)`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[api] ${signal} received, draining`);
    engine.stop();
    await realtime.close();
    server.close(() => undefined);
    await prisma.$disconnect();
    if (redis) await redis.quit();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

const isEntrypoint = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isEntrypoint) {
  main().catch((error) => {
    console.error("[api] fatal", error);
    process.exit(1);
  });
}
