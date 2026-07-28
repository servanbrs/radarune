import "server-only";
import { createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { entitlementService } from "@/features/billing/server/services/entitlement.service";
import type { CanonicalDistributionPayload } from "@/features/distribution-hub/domain/provider";
import { distributionStatusHistoryRepository } from "@/features/distribution-hub/server/repositories/distribution-status-history.repository";
import { distributionJobRepository } from "@/features/distribution-hub/server/repositories/distribution-job.repository";
import { releaseDeliveryRepository } from "@/features/distribution-hub/server/repositories/release-delivery.repository";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";
import { distributionValidationService } from "@/features/distribution-hub/server/services/distribution-validation.service";
import { distributionPayloadService } from "@/features/distribution-hub/server/services/distribution-payload.service";
import {
  createDistributionJobSchema,
  type CreateDistributionJobInput,
} from "@/features/distribution-hub/schemas/distribution.schema";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { rbacService } from "@/features/authorization/server/rbac";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { releaseRepository } from "@/features/releases/server/repositories/release.repository";
import { prisma } from "@/server/prisma/prisma";

function assertManagePermission(actor: FinanceActorContext) {
  if (
    !rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "distribution:manage",
      systemRole: actor.systemRole,
    })
  ) {
    throw new Error("Distribution job oluşturmak için yetkiniz yok.");
  }
}

function buildPayloadHash(payload: CreateDistributionJobInput["payload"]) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function buildIdempotencyKey(params: {
  payloadHash: string;
  provider: string;
  releaseId: string;
  releaseVersion: number;
}) {
  return createHash("sha256")
    .update(`${params.releaseId}:${params.provider}:${params.releaseVersion}:${params.payloadHash}`)
    .digest("hex");
}

function normalizePayload(
  payload: CreateDistributionJobInput["payload"],
): CanonicalDistributionPayload {
  return {
    organizationId: payload.organizationId,
    releaseId: payload.releaseId,
    releaseVersion: payload.releaseVersion,
    releaseStatus: payload.releaseStatus,
    title: payload.title,
    ...(payload.subtitle ? { subtitle: payload.subtitle } : {}),
    isExistingRelease: payload.isExistingRelease,
    ...(payload.upc ? { upc: payload.upc } : {}),
    releaseType: payload.releaseType,
    ...(payload.labelName ? { labelName: payload.labelName } : {}),
    ...(payload.copyrightLine ? { copyrightLine: payload.copyrightLine } : {}),
    ...(payload.productionLine ? { productionLine: payload.productionLine } : {}),
    releaseDate: payload.releaseDate,
    ...(payload.originalReleaseDate ? { originalReleaseDate: payload.originalReleaseDate } : {}),
    artworkUrl: payload.artworkUrl,
    ...(payload.languageCode ? { languageCode: payload.languageCode } : {}),
    explicit: payload.explicit,
    presaveEnabled: payload.presaveEnabled,
    contentIdEnabled: payload.contentIdEnabled,
    dolbyAtmosEnabled: payload.dolbyAtmosEnabled,
    artists: payload.artists,
    tracks: payload.tracks.map((track) => ({
      trackId: track.trackId,
      title: track.title,
      ...(track.isrc ? { isrc: track.isrc } : {}),
      audioFileUrl: track.audioFileUrl,
      ...(track.durationSeconds ? { durationSeconds: track.durationSeconds } : {}),
      explicit: track.explicit,
      ...(track.languageCode ? { languageCode: track.languageCode } : {}),
      contributors: track.contributors,
    })),
    stores: payload.stores,
    territories: payload.territories,
  };
}

export class DistributionJobService {
  async listJobs(actor: FinanceActorContext) {
    if (
      !rbacService.hasEffectivePermission({
        membershipRole: actor.membershipRole,
        permission: "distribution:view",
        systemRole: actor.systemRole,
      })
    ) {
      throw new Error("Distribution job kayıtlarını görüntülemek için yetkiniz yok.");
    }

    return distributionJobRepository.listByOrganization(actor.organizationId);
  }

  async getJob(actor: FinanceActorContext, jobId: string) {
    if (
      !rbacService.hasEffectivePermission({
        membershipRole: actor.membershipRole,
        permission: "distribution:view",
        systemRole: actor.systemRole,
      })
    ) {
      throw new Error("Distribution job kaydını görüntülemek için yetkiniz yok.");
    }

    const job = await distributionJobRepository.findById(jobId);
    if (!job || job.organizationId !== actor.organizationId) {
      return null;
    }

    return job;
  }

  async createJob(actor: FinanceActorContext, input: CreateDistributionJobInput) {
    assertManagePermission(actor);

    await entitlementService.assertFeatureEnabled(
      {
        organizationId: actor.organizationId,
      },
      "distribution.enabled",
    );

    const parsed = createDistributionJobSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false as const,
        message:
          Object.values(parsed.error.flatten().fieldErrors).flat().find(Boolean) ??
          "Distribution payload doğrulanamadı.",
      };
    }

    if (parsed.data.payload.organizationId !== actor.organizationId) {
      return {
        success: false as const,
        message: "Payload organizationId mevcut organizasyonla eşleşmiyor.",
      };
    }

    const provider =
      parsed.data.provider ??
      (
        await distributionProviderConfigurationService.getRuntimeConfiguration(
          actor.organizationId,
          "INTERNAL",
        )
      )?.provider ??
      (
        await distributionProviderConfigurationService.getRuntimeConfiguration(
          actor.organizationId,
          "ONE_RPM",
        )
      )?.provider ??
      "INTERNAL";

    const runtimeConfig = await distributionProviderConfigurationService.getRuntimeConfiguration(
      actor.organizationId,
      provider,
    );
    const normalizedPayload = normalizePayload(parsed.data.payload);

    const validation = distributionValidationService.validateRelease(
      provider,
      normalizedPayload,
      runtimeConfig,
    );
    const payloadHash = buildPayloadHash(parsed.data.payload);
    const idempotencyKey = buildIdempotencyKey({
      releaseId: normalizedPayload.releaseId,
      provider,
      releaseVersion: normalizedPayload.releaseVersion,
      payloadHash,
    });

    const duplicate = await distributionJobRepository.findDuplicate({
      organizationId: actor.organizationId,
      releaseId: normalizedPayload.releaseId,
      provider,
      releaseVersion: normalizedPayload.releaseVersion,
      payloadHash,
    });

    if (duplicate && ["SUCCEEDED", "PARTIALLY_SUCCEEDED", "PROCESSING", "QUEUED", "WAITING_PROVIDER"].includes(duplicate.status)) {
      return {
        success: false as const,
        message: "Aynı payload için zaten dağıtım job kaydı mevcut.",
      };
    }

    let job;
    try {
      job = await prisma.$transaction(async (tx) => {
      const created = await distributionJobRepository.create(
        {
          organizationId: actor.organizationId,
          createdByUserId: actor.userId,
          ...(runtimeConfig?.id ? { providerConfigurationId: runtimeConfig.id } : {}),
          provider,
          status: validation.success ? "QUEUED" : "PENDING",
          releaseId: normalizedPayload.releaseId,
          releaseVersion: normalizedPayload.releaseVersion,
          releaseTitle: normalizedPayload.title,
          idempotencyKey,
          payloadHash,
          canonicalPayload: normalizedPayload as unknown as Prisma.InputJsonValue,
          maxRetryCount: runtimeConfig?.maxRetryCount ?? 3,
          ...(validation.success ? { queuedAt: new Date() } : {}),
        },
        tx,
      );

      await releaseDeliveryRepository.upsertForJob(
        {
          organizationId: actor.organizationId,
          jobId: created.id,
          ...(runtimeConfig?.id ? { providerConfigurationId: runtimeConfig.id } : {}),
          provider,
          releaseId: normalizedPayload.releaseId,
          releaseVersion: normalizedPayload.releaseVersion,
          status: validation.success ? "QUEUED" : "NOT_SENT",
        },
        tx,
      );

      if (validation.success) {
        await releaseRepository.updateStatus(
          normalizedPayload.releaseId,
          {
            status: "QUEUED",
            previousStatus: "APPROVED",
            organizationId: actor.organizationId,
            actorUserId: actor.userId,
            reason: "Yayın dağıtım kuyruğuna alındı.",
            metadata: {
              provider,
              distributionJobId: created.id,
            },
          },
          tx,
        );
      }

      await distributionStatusHistoryRepository.create(
        {
          organizationId: actor.organizationId,
          jobId: created.id,
          status: validation.success ? "QUEUED" : "PENDING",
          message: validation.success
            ? "Job kuyruğa alındı."
            : "Job validation incelemesi için bekliyor.",
          metadata: {
            provider,
            validationIssues: validation.issues,
          },
        },
        tx,
      );

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "distribution.job.created",
          entityType: "DistributionJob",
          entityId: created.id,
          metadata: {
            provider,
            releaseId: normalizedPayload.releaseId,
            releaseVersion: normalizedPayload.releaseVersion,
            validationSucceeded: validation.success,
          },
        },
        tx,
      );

      return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await distributionJobRepository.findByIdempotencyKey(idempotencyKey);
        if (existing && existing.organizationId === actor.organizationId) {
          return {
            success: true as const,
            data: { id: existing.id, status: existing.status },
            message: "Aynı idempotency anahtarı için mevcut job döndürüldü.",
          };
        }
      }
      throw error;
    }

    return {
      success: true as const,
      data: {
        id: job.id,
        status: job.status,
      },
    };
  }

  async createJobForApprovedRelease(
    actor: FinanceActorContext,
    input: {
      releaseId: string;
      provider?: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
    },
  ) {
    assertManagePermission(actor);

    const payload = await distributionPayloadService.buildFromApprovedRelease({
      organizationId: actor.organizationId,
      releaseId: input.releaseId,
    });

    if (!payload.success) {
      return {
        success: false as const,
        message: payload.message,
      };
    }

    return this.createJob(actor, {
      ...(input.provider ? { provider: input.provider } : {}),
      payload: payload.data,
    });
  }

  async cancelJob(actor: FinanceActorContext, jobId: string, reason: string) {
    assertManagePermission(actor);

    const job = await distributionJobRepository.findById(jobId);

    if (!job || job.organizationId !== actor.organizationId) {
      return {
        success: false as const,
        message: "Distribution job bulunamadı.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await distributionJobRepository.updateStatus(
        jobId,
        {
          status: "CANCELLED",
          cancelledAt: new Date(),
          lastErrorMessage: reason,
          lockedAt: null,
          lockedBy: null,
        },
        tx,
      );
      await distributionStatusHistoryRepository.create(
        {
          organizationId: actor.organizationId,
          jobId,
          previousStatus: job.status,
          status: "CANCELLED",
          message: reason,
        },
        tx,
      );
      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "distribution.job.cancelled",
          entityType: "DistributionJob",
          entityId: jobId,
          metadata: {
            reason,
          },
        },
        tx,
      );
    });

    return {
      success: true as const,
      data: {
        id: jobId,
      },
    };
  }

  async retryJob(actor: FinanceActorContext, jobId: string) {
    assertManagePermission(actor);

    const job = await distributionJobRepository.findById(jobId);

    if (!job || job.organizationId !== actor.organizationId) {
      return {
        success: false as const,
        message: "Distribution job bulunamadı.",
      };
    }

    if (!["FAILED", "MANUAL_REVIEW", "RETRY_SCHEDULED"].includes(job.status)) {
      return {
        success: false as const,
        message: "Yalnızca başarısız veya manuel incelemedeki job tekrar kuyruğa alınabilir.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await distributionJobRepository.updateStatus(
        jobId,
        {
          status: "QUEUED",
          nextAttemptAt: null,
          queuedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
        tx,
      );

      await distributionStatusHistoryRepository.create(
        {
          organizationId: actor.organizationId,
          jobId,
          previousStatus: job.status,
          status: "QUEUED",
          message: "Job manuel olarak tekrar kuyruğa alındı.",
        },
        tx,
      );

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "distribution.job.retry",
          entityType: "DistributionJob",
          entityId: jobId,
          metadata: {
            previousStatus: job.status,
            provider: job.provider,
          },
        },
        tx,
      );
    });

    return {
      success: true as const,
      data: {
        id: jobId,
        status: "QUEUED",
      },
    };
  }
}

export const distributionJobService = new DistributionJobService();
