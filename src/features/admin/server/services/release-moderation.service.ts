import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { adminReleaseRepository } from "@/features/admin/server/repositories/admin-release.repository";
import { notificationService } from "@/features/admin/server/services/notification.service";
import { releaseStateService, type ReleaseStatusValue } from "@/features/admin/server/services/release-state.service";
import { distributionPayloadService } from "@/features/distribution-hub/server/services/distribution-payload.service";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { releaseRepository } from "@/features/releases/server/repositories/release.repository";
import { releaseValidatorService } from "@/features/releases/server/services/release-validator.service";
import type { ReleaseModerationActionInput } from "@/features/admin/schemas/admin.schema";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

export class ReleaseModerationService {
  async listReleases(actor: FinanceActorContext, params: { page: number; pageSize: number; search?: string }) {
    assertAdminPermission(actor, "releases:view");
    return adminReleaseRepository.list({ ...params, organizationId: actor.organizationId });
  }

  async getRelease(actor: FinanceActorContext, id: string) {
    assertAdminPermission(actor, "releases:view");
    const release = await adminReleaseRepository.findById(id);
    if (!release || release.organizationId !== actor.organizationId) {
      return null;
    }
    return release;
  }

  async handleAction(actor: FinanceActorContext, id: string, input: ReleaseModerationActionInput) {
    if (input.action === "QUEUE_DISTRIBUTION") {
      assertAdminPermission(actor, "releases:distribute");
    } else {
      assertAdminPermission(actor, "releases:review");
    }

    const release = await adminReleaseRepository.findById(id);
    if (!release || release.organizationId !== actor.organizationId) {
      throw new Error("Yayın bulunamadı.");
    }

    if (input.action === "APPROVE") {
      return this.approveRelease(actor, release.id);
    }

    if (input.action === "REJECT") {
      if (!input.reason) {
        throw new Error("Yayın reddi için açıklama zorunludur.");
      }
      return this.transitionWithAudit(actor, release.id, release.status, "REJECTED", input.reason);
    }

    if (input.action === "REQUEST_REVISION") {
      if (input.revisionItems.length === 0) {
        throw new Error("Revizyon isteği için en az bir madde zorunludur.");
      }
      return this.requestRevision(actor, release.id, release.status, input);
    }

    releaseStateService.assertTransition(release.status as ReleaseStatusValue, "QUEUED");
    const payloadResult = await distributionPayloadService.buildFromApprovedRelease({
      organizationId: actor.organizationId,
      releaseId: release.id,
    });
    if (!payloadResult.success) {
      throw new Error(payloadResult.message);
    }
    return distributionJobService.createJob(actor, {
      provider: release.distributionProvider ?? undefined,
      payload: payloadResult.data,
    });
  }

  private async approveRelease(actor: FinanceActorContext, releaseId: string) {
    return prisma.$transaction(async (tx) => {
      const release = await adminReleaseRepository.findById(releaseId, tx);
      if (!release || release.organizationId !== actor.organizationId) {
        throw new Error("Yayın bulunamadı.");
      }

      releaseStateService.assertTransition(release.status as ReleaseStatusValue, "APPROVED");
      const issues = releaseValidatorService.validateForSubmit(release);
      const hasBlockingIssue = issues.some((issue) => issue.severity === "ERROR");
      if (hasBlockingIssue) {
        throw new Error("Kritik validation hatası olan yayın onaylanamaz.");
      }

      const updated = await releaseRepository.updateStatus(
        release.id,
        {
          status: "APPROVED",
          previousStatus: release.status,
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          reason: "Yayın admin tarafından onaylandı.",
        },
        tx,
      );

      await notificationService.create(
        {
          organizationId: actor.organizationId,
          userId: release.createdByUserId,
          type: "RELEASE_APPROVED",
          title: "Yayının onaylandı",
          message: `${release.title} yayını onaylandı.`,
          entityType: "Release",
          entityId: release.id,
        },
        tx,
      );

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "RELEASE_APPROVED",
          entityType: "Release",
          entityId: release.id,
        },
        tx,
      );

      return updated;
    });
  }

  private async requestRevision(
    actor: FinanceActorContext,
    releaseId: string,
    previousStatus: ReleaseStatusValue,
    input: ReleaseModerationActionInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const release = await adminReleaseRepository.findById(releaseId, tx);
      if (!release || release.organizationId !== actor.organizationId) {
        throw new Error("Yayın bulunamadı.");
      }

      releaseStateService.assertTransition(previousStatus, "REVISION_REQUESTED");
      await adminReleaseRepository.createRevisionIssues(
        {
          organizationId: actor.organizationId,
          releaseId,
          issues: input.revisionItems.map((item) => ({
            fieldPath: item.fieldPath,
            step: item.category,
            code: `REVISION_${item.category}`,
            message: item.message,
            severity: item.severity,
          })),
        },
        tx,
      );

      const updated = await releaseRepository.updateStatus(
        releaseId,
        {
          status: "REVISION_REQUESTED",
          previousStatus,
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          reason: input.reason ?? "Yayın için revizyon istendi.",
          metadata: { revisionItemCount: input.revisionItems.length },
        },
        tx,
      );

      await notificationService.create(
        {
          organizationId: actor.organizationId,
          userId: release.createdByUserId,
          type: "RELEASE_REVISION_REQUESTED",
          title: "Yayın için revizyon istendi",
          message: input.reason ?? "Yayının için revizyon maddeleri oluşturuldu.",
          entityType: "Release",
          entityId: releaseId,
        },
        tx,
      );

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "RELEASE_REVISION_REQUESTED",
          entityType: "Release",
          entityId: releaseId,
          metadata: { revisionItemCount: input.revisionItems.length },
        },
        tx,
      );

      return updated;
    });
  }

  private async transitionWithAudit(
    actor: FinanceActorContext,
    releaseId: string,
    previousStatus: ReleaseStatusValue,
    nextStatus: ReleaseStatusValue,
    reason: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const release = await adminReleaseRepository.findById(releaseId, tx);
      if (!release || release.organizationId !== actor.organizationId) {
        throw new Error("Yayın bulunamadı.");
      }

      releaseStateService.assertTransition(previousStatus, nextStatus);
      const updated = await releaseRepository.updateStatus(
        releaseId,
        { status: nextStatus, previousStatus, organizationId: actor.organizationId, actorUserId: actor.userId, reason },
        tx,
      );

      await notificationService.create(
        {
          organizationId: actor.organizationId,
          userId: release.createdByUserId,
          type: `RELEASE_${nextStatus}`,
          title: "Yayın durumu güncellendi",
          message: reason,
          entityType: "Release",
          entityId: releaseId,
        },
        tx,
      );

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: `RELEASE_${nextStatus}`,
          entityType: "Release",
          entityId: releaseId,
          metadata: { reason },
        },
        tx,
      );

      return updated;
    });
  }
}

export const releaseModerationService = new ReleaseModerationService();
