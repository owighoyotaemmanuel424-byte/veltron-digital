import { AuditOutcome, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
type AuditInput = {
  actorId?: string | null; action: string; entityType: string; entityId?: string | null;
  outcome?: AuditOutcome; ipAddress?: string | null; userAgent?: string | null;
  requestId?: string | null; details?: Prisma.InputJsonValue;
};
export async function writeAudit(input: AuditInput) {
  return prisma.auditLog.create({ data: {
    actorId: input.actorId ?? null, action: input.action, entityType: input.entityType,
    entityId: input.entityId ?? null, outcome: input.outcome ?? AuditOutcome.SUCCESS,
    ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null,
    requestId: input.requestId ?? null, details: input.details
  }});
}
