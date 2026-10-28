import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

import { loadConfig } from "./config.js";
import { prisma } from "./db.js";
import { formatAmount } from "./lib/money.js";
import { runVaultAccruals } from "./services/vaults.js";

/**
 * Savings vault daemon.
 *
 * With Redis available it runs as a BullMQ worker consuming the repeatable
 * `vault-accrual` job (hourly). Without Redis — e.g. a single-node dev box — it
 * degrades to a setInterval loop so the accrual logic is always exercised.
 * Both paths call the same idempotent `runVaultAccruals`, keyed per vault-hour.
 */

const QUEUE_NAME = "vault-daemon";
const JOB_NAME = "vault-accrual";

export async function processAccrual(): Promise<void> {
  const summary = await runVaultAccruals(prisma, "USD", new Date());
  console.log(
    `[vault-daemon] processed=${summary.processed} credited=${formatAmount(summary.creditedMinor)} skipped=${summary.skipped}`,
  );
}

async function main() {
  const config = loadConfig();

  if (!config.redisUrl) {
    console.warn("[vault-daemon] REDIS_URL not set — using in-process hourly schedule");
    await processAccrual();
    const timer = setInterval(() => {
      processAccrual().catch((error) => console.error("[vault-daemon] accrual failed", error));
    }, 60 * 60 * 1000);
    timer.unref();
    return;
  }

  const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
  const queue = new Queue(QUEUE_NAME, { connection: connection as never });

  await queue.add(
    JOB_NAME,
    {},
    {
      repeat: { pattern: "0 * * * *" }, // hourly, on the hour
      removeOnComplete: 100,
      removeOnFail: 100,
      jobId: JOB_NAME,
    },
  );

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name !== JOB_NAME) return;
      await processAccrual();
    },
    { connection: connection as never, concurrency: 1 },
  );

  worker.on("failed", (job, error) => console.error(`[vault-daemon] job ${job?.id} failed`, error));

  const shutdown = async () => {
    await worker.close();
    await queue.close();
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  console.log("[vault-daemon] listening for hourly vault accrual jobs");
}

main().catch((error) => {
  console.error("[vault-daemon] fatal", error);
  process.exit(1);
});
