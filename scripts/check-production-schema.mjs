import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const requiredTables = ["User", "Session", "EmailVerificationToken", "RecoveryCode"];

try {
  for (const table of requiredTables) {
    // Table names are fixed in this file, never derived from request input.
    await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 0`);
  }
  console.log("Production schema preflight passed: critical authentication tables exist.");
} catch (error) {
  const code = error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "unknown";
  console.error(
    "Production schema preflight failed. A required authentication table is missing or unreachable. " +
    "Check the production DATABASE_URL and Prisma migration history before retrying. " +
    `Database error code: ${code}`,
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
