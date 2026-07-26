import "server-only";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { auditLogRepository } from "@/features/finance/server/repositories/audit-log.repository";

export class AuditLogService {
  async create(input: {
    organizationId?: string;
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }, client?: DatabaseClient) {
    return auditLogRepository.create(input, client);
  }
}

export const auditLogService = new AuditLogService();
