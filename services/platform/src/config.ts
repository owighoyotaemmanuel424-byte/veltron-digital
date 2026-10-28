import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2_592_000),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(16),
  ENGINE_TICK_MS: z.coerce.number().int().positive().default(750),
  ENGINE_SYMBOLS: z.string().default("BTC:67000,ETH:3200,SOL:150"),
});

export type Config = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databaseUrl: string;
  redisUrl?: string;
  jwtSecret: string;
  jwtAccessTtl: number;
  jwtRefreshTtl: number;
  corsOrigins: string[];
  telegramWebhookSecret: string;
  engineTickMs: number;
  engineSymbols: { symbol: string; price: number }[];
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  const value = parsed.data;
  return {
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    databaseUrl: value.DATABASE_URL,
    redisUrl: value.REDIS_URL,
    jwtSecret: value.JWT_SECRET,
    jwtAccessTtl: value.JWT_ACCESS_TTL,
    jwtRefreshTtl: value.JWT_REFRESH_TTL,
    corsOrigins: value.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
    telegramWebhookSecret: value.TELEGRAM_WEBHOOK_SECRET,
    engineTickMs: value.ENGINE_TICK_MS,
    engineSymbols: value.ENGINE_SYMBOLS.split(",").map((entry) => {
      const [symbol, price] = entry.split(":");
      return { symbol: (symbol ?? "BTC").trim(), price: Number(price ?? 100) };
    }),
  };
}
