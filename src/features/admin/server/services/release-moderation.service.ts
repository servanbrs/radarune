import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { adminReleaseRepository } from "@/features/admin/server/repositories/admin-release.repository";
import { notificationService } from "@/features/admin/server/services/notification.service";
import { releaseStateService, type ReleaseStatusValue } from "@/features/admin/server/services/release-state.service";
import { distributionPayloadService } from "@/features/distribution-hub/server/services/distribution-payload.service";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { releaseRepository } from "@/features/releases/server/repositories/release.repository";
import { releaseValidatorService } from "@/features/releases/server/services/release-validator.service";
import type { ReleaseModerationActionInput } from "@/features/admin/schemas/admin.schema";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

export class ReleaseModerationService {
  async listReleases(actor: FinanceActorContext, params: { page: number; pageSize: number; search?: string; status?: Parameters<typeof adminReleaseRepository.list>[0]["status"] }) {
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
    const job = await distributionJobService.createJob(actor, {
      provider: release.distributionProvider ?? undefined,
      payload: payloadResult.data,
    });
    await notificationService.create({
      organizationId: actor.organizationId,
      userId: release.createdByUserId,
      type: "RELEASE_QUEUED_FOR_DISTRIBUTION",
      title: "Yayın dağıtım kuyruğuna alındı",
      message: `${release.title} dağıtım için kuyruğa alındı.`,
      entityType: "Release",
      entityId: release.id,
    });
    return job;
  }

  private async approveRelease(actor: FinanceActorContext, releaseId: string) {
    const updated = await prisma.$transaction(async (tx) => {
      const release = await adminReleaseRepository.findById(releaseId, tx);
      if (!release || release.organizationId !== actor.organizationId) {
        throw new Error("Yayın bulunamadı.");
      }

      releaseStateService.assertTransition(release.status as ReleaseStatusValue, "APPROVED");
      const issues = releaseValidatorService.validateForSubmit({
        ...release,
        ...(release.uploads.find((upload) => upload.id === release.artworkUploadId)?.status
          ? { artworkUploadStatus: release.uploads.find((upload) => upload.id === release.artworkUploadId)!.status }
          : {}),
        tracks: release.tracks.map((track) => ({
          ...track,
          ...(track.uploads.find((upload) => upload.id === track.audioUploadId)?.status
            ? { audioUploadStatus: track.uploads.find((upload) => upload.id === track.audioUploadId)!.status }
            : {}),
        })),
      });
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

      await notificationService.notifyArtistFollowers(
        {
          organizationId: actor.organizationId,
          artistIds: release.artists.map((releaseArtist) => releaseArtist.artistId),
          releaseId: release.id,
          releaseTitle: release.title,
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

    // ONErpm automation is intentionally a two-step flow: approval creates the
    // preparation job, while the final submission remains a human action after
    // the operator reviews the filled form and the uploaded assets.
    try {
      const oneRpmConfiguration = await distributionProviderConfigurationService.getRuntimeConfiguration(
        actor.organizationId,
        "ONE_RPM",
      );

      if (oneRpmConfiguration?.isEnabled && oneRpmConfiguration.publicMetadata.mode === "AUTOMATION") {
        const job = await distributionJobService.createJobForApprovedRelease(actor, {
          releaseId,
          provider: "ONE_RPM",
        });

        if (job.success) {
          await notificationService.create({
            organizationId: actor.organizationId,
            userId: actor.userId,
            type: "RELEASE_QUEUED_FOR_DISTRIBUTION",
            title: "ONErpm hazırlığı kuyruğa alındı",
            message: "Onaylanan yayın için ONErpm formu ve dosya aktarımı hazırlanacak. Son gönderim kontrolünüzden sonra yapılır.",
            entityType: "DistributionJob",
            entityId: job.data.id,
          });
        } else {
          await auditLogService.create({
            organizationId: actor.organizationId,
            actorUserId: actor.userId,
            action: "distribution.onerpm.queue_failed",
            entityType: "Release",
            entityId: releaseId,
            metadata: { message: job.message },
          });
        }
      }
    } catch (error) {
      // Approval must not be reported as failed if the optional automation
      // queue is temporarily unavailable. The audit trail remains best effort.
      try {
        await auditLogService.create({
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "distribution.onerpm.queue_failed",
          entityType: "Release",
          entityId: releaseId,
          metadata: {
            message: error instanceof Error ? error.message : "ONErpm kuyruğu oluşturulamadı.",
          },
        });
      } catch {
        // Do not turn a successful moderation action into a user-facing error.
      }
    }

    return updated;
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
