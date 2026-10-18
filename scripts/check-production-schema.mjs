import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Keep this list aligned with the Prisma models required by production routes.
// Names are fixed identifiers, never derived from request input.
const requiredTables = [
  "User",
  "EmailVerificationToken",
  "Session",
  "RecoveryCode",
  "Service",
  "Order",
  "Payment",
  "WebhookEvent",
  "AuditLog",
  "WalletAccount",
  "LedgerTransaction",
  "LedgerEntry",
  "HostedSite",
  "TelephonyLog",
  "GeneratedDocument",
  "AuthRateLimit",
];

try {
  for (const table of requiredTables) {
    await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 0`);
  }
  console.log(
    `Production schema preflight passed: all ${requiredTables.length} required application tables exist.`,
  );
} catch (error) {
  const code = error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "unknown";
  console.error(
    "Production schema preflight failed. A required application table is missing or unreachable. " +
    "Check the production DATABASE_URL and Prisma migration history before retrying. " +
    `Database error code: ${code}`,
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
