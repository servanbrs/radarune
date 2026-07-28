import "server-only";

import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { databaseDistributionQueueService } from "@/features/distribution-hub/server/services/database-queue.service";

type AdminActor = Parameters<typeof assertAdminPermission>[0];

export class DistributionOperationsService {
  async listDeadLetterJobs(
    actor: AdminActor,
    take = 50,
  ) {
    assertAdminPermission(actor, "distribution:view");

    return databaseDistributionQueueService.listDeadLetterJobs(
      actor.organizationId,
      take,
    );
  }

  async requeueDeadLetterJob(
    actor: AdminActor,
    jobId: string,
  ) {
    assertAdminPermission(actor, "distribution:manage");

    const normalizedJobId = jobId.trim();

    if (!normalizedJobId) {
      throw new Error("Distribution job kimliği boş olamaz.");
    }

    const job = await databaseDistributionQueueService.requeueDeadLetterJob(
      normalizedJobId,
      actor.organizationId,
    );

    if (!job) {
      return null;
    }

    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "distribution.job.requeue",
      entityType: "DistributionJob",
      entityId: job.id,
      metadata: {
        previousStatus: "MANUAL_REVIEW",
        nextStatus: "QUEUED",
        provider: job.provider,
        releaseId: job.releaseId,
      },
    });

    return job;
  }
}

export const distributionOperationsService =
  new DistributionOperationsService();
