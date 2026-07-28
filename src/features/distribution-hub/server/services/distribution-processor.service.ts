import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { distributionProviderRegistry } from "@/features/distribution-hub/server/provider-registry";
import { distributionAttemptRepository } from "@/features/distribution-hub/server/repositories/distribution-attempt.repository";
import { distributionJobRepository } from "@/features/distribution-hub/server/repositories/distribution-job.repository";
import { distributionStatusHistoryRepository } from "@/features/distribution-hub/server/repositories/distribution-status-history.repository";
import { providerExternalReferenceRepository } from "@/features/distribution-hub/server/repositories/provider-external-reference.repository";
import { releaseDeliveryRepository } from "@/features/distribution-hub/server/repositories/release-delivery.repository";
import { databaseDistributionQueueService } from "@/features/distribution-hub/server/services/database-queue.service";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";
import { distributionValidationService } from "@/features/distribution-hub/server/services/distribution-validation.service";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { releaseRepository } from "@/features/releases/server/repositories/release.repository";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

function createBackoffDate(attemptCount: number) {
  const delayMinutes = Math.min(60, 2 ** Math.max(0, attemptCount - 1));
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}

export class DistributionProcessorService {
  async processNextJob(workerId: string) {
    const job = await databaseDistributionQueueService.reserve(workerId);

    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;


    if (!job) {
      return {
        success: true as const,
        data: {
          processed: false,
        },
      };
    }

    const runtimeConfig = await distributionProviderConfigurationService.getRuntimeConfiguration(
      job.organizationId,
      job.provider,
    );
    const adapter = distributionProviderRegistry.getAdapter(job.provider);
    const payload = job.canonicalPayload as unknown as Parameters<
      typeof distributionValidationService.validateRelease
    >[1];

    const validation = distributionValidationService.validateRelease(
      job.provider,
      payload,
      runtimeConfig,
    );

    if (!validation.success) {
      await prisma.$transaction(async (tx) => {
        await distributionJobRepository.updateStatus(
          job.id,
          {
            status: "FAILED",
            validationIssues: validation.issues as unknown as Prisma.InputJsonValue,
            lockedAt: null,
            lockedBy: null,
            lastErrorCode: "VALIDATION_ERROR",
            lastErrorMessage: "Provider validation başarısız.",
          },
          tx,
        );

        const delivery = await releaseDeliveryRepository.findByReleaseAndProvider(
          job.organizationId,
          job.releaseId,
          job.provider,
          tx,
        );

        if (delivery) {
          await releaseDeliveryRepository.updateStatus(
            delivery.id,
            {
              status: "FAILED",
              failureReason: "Provider validation başarısız.",
              failedAt: new Date(),
            },
            tx,
          );
        }

        await distributionStatusHistoryRepository.create(
          {
            organizationId: job.organizationId,
            jobId: job.id,
            previousStatus: job.status,
            status: "FAILED",
            message: "Provider validation başarısız.",
            metadata: {
              issues: validation.issues,
            },
          },
          tx,
        );
      });

      return {
        success: false as const,
        message: "Provider validation başarısız.",
      };
    }

    
    heartbeatInterval = setInterval(async () => {
      try {
        const ok =
          await databaseDistributionQueueService.heartbeat(
            job.id,
            workerId,
          );

        if (!ok) {
          clearInterval(heartbeatInterval!);
          heartbeatInterval = null;
        }
      } catch {
        clearInterval(heartbeatInterval!);
        heartbeatInterval = null;
      }
    }, 30000);

await releaseRepository.updateStatus(job.releaseId, {
      status: "PROCESSING",
      previousStatus: "QUEUED",
      reason: "Dağıtım worker işlemi başlattı.",
      metadata: {
        distributionJobId: job.id,
        provider: job.provider,
      },
    });

    const startedAt = Date.now();
    const providerTimeoutMs =
      (runtimeConfig?.timeoutSeconds ?? 60) * 1000;

    type CreateReleaseResult = Awaited<
      ReturnType<typeof adapter.createRelease>
    >;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let createResult: CreateReleaseResult;

    try {
      const providerRequest = adapter.createRelease(
        {
          idempotencyKey: job.idempotencyKey,
          payload,
        },
        runtimeConfig
          ? {
              environment: runtimeConfig.environment,
              credentials: runtimeConfig.credentials,
              publicMetadata: runtimeConfig.publicMetadata,
              ...(runtimeConfig.webhookSecret
                ? {
                    webhookSecret: runtimeConfig.webhookSecret,
                  }
                : {}),
            }
          : null,
      );

      const timeoutRequest = new Promise<CreateReleaseResult>(
        (resolve) => {
          timeoutId = setTimeout(() => {
            resolve({
              success: false,
              code: "PROVIDER_ERROR",
              message: `Provider ${providerTimeoutMs / 1000} saniye içinde yanıt vermedi.`,
              retryable: true,
            } as CreateReleaseResult);
          }, providerTimeoutMs);
        },
      );

      createResult = await Promise.race([
        providerRequest,
        timeoutRequest,
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Provider çağrısında beklenmeyen bir hata oluştu.";

      createResult = {
        success: false,
        code: "PROVIDER_ERROR",
        message: errorMessage,
        retryable: true,
      } as CreateReleaseResult;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    }

    const durationMs = Date.now() - startedAt;
    const nextAttemptCount = job.attemptCount + 1;

    await distributionAttemptRepository.create({
      organizationId: job.organizationId,
      jobId: job.id,
      provider: job.provider,
      attemptNumber: nextAttemptCount,
      status: createResult.success ? "SUCCEEDED" : "FAILED",
      idempotencyKey: job.idempotencyKey,
      retryable: createResult.success ? false : createResult.retryable ?? false,
      requestPayload: payload as unknown as Prisma.InputJsonValue,
      ...(createResult.success
        ? {
            responsePayload: createResult.data as unknown as Prisma.InputJsonValue,
          }
        : {}),
      ...(createResult.success
        ? {}
        : {
            errorCode: createResult.code,
            errorMessage: createResult.message,
          }),
      finishedAt: new Date(),
      durationMs,
    });

    if (!createResult.success) {
      const retryable =
        createResult.retryable ?? createResult.code === "PROVIDER_ERROR";
      const canRetry = retryable && nextAttemptCount < job.maxRetryCount;
      const nextAttemptAt = canRetry ? createBackoffDate(nextAttemptCount) : null;

      await prisma.$transaction(async (tx) => {
        await distributionJobRepository.updateStatus(
          job.id,
          {
            status: canRetry ? "RETRY_SCHEDULED" : "MANUAL_REVIEW",
            attemptCount: nextAttemptCount,
            nextAttemptAt,
            lastErrorCode: createResult.code,
            lastErrorMessage: createResult.message,
            lockedAt: null,
            lockedBy: null,
          },
          tx,
        );

        const delivery = await releaseDeliveryRepository.findByReleaseAndProvider(
          job.organizationId,
          job.releaseId,
          job.provider,
          tx,
        );

        if (delivery) {
          await releaseDeliveryRepository.updateStatus(
            delivery.id,
            {
              status: canRetry ? "QUEUED" : "FAILED",
              failureReason: createResult.message,
              ...(canRetry ? {} : { failedAt: new Date() }),
            },
            tx,
          );
        }

        await distributionStatusHistoryRepository.create(
          {
            organizationId: job.organizationId,
            jobId: job.id,
            previousStatus: job.status,
            status: canRetry ? "RETRY_SCHEDULED" : "MANUAL_REVIEW",
            message: createResult.message,
          },
          tx,
        );

        await auditLogService.create(
          {
            organizationId: job.organizationId,
            action: "distribution.job.failed",
            entityType: "DistributionJob",
            entityId: job.id,
            metadata: {
              provider: job.provider,
              retryable: canRetry,
              errorCode: createResult.code,
            },
          },
          tx,
        );
      });

      return {
        success: false as const,
        message: createResult.message,
      };
    }

    const assignmentConflict = await this.findGeneratedCodeConflict({
      releaseId: job.releaseId,
      ...(createResult.data.generatedUpc
        ? { generatedUpc: createResult.data.generatedUpc }
        : {}),
      ...(createResult.data.generatedTrackIsrcs
        ? { generatedTrackIsrcs: createResult.data.generatedTrackIsrcs }
        : {}),
    });

    if (assignmentConflict) {
      await prisma.$transaction(async (tx) => {
        await distributionJobRepository.updateStatus(
          job.id,
          {
            status: "MANUAL_REVIEW",
            attemptCount: nextAttemptCount,
            lockedAt: null,
            lockedBy: null,
            lastErrorCode: "CODE_ASSIGNMENT_CONFLICT",
            lastErrorMessage: assignmentConflict,
          },
          tx,
        );

        await distributionStatusHistoryRepository.create(
          {
            organizationId: job.organizationId,
            jobId: job.id,
            previousStatus: job.status,
            status: "MANUAL_REVIEW",
            message: assignmentConflict,
          },
          tx,
        );
      });

      return {
        success: false as const,
        message: assignmentConflict,
      };
    }

    await prisma.$transaction(async (tx) => {
      await this.applyGeneratedCodes({
        releaseId: job.releaseId,
        ...(createResult.data.generatedUpc
          ? { generatedUpc: createResult.data.generatedUpc }
          : {}),
        ...(createResult.data.generatedTrackIsrcs
          ? { generatedTrackIsrcs: createResult.data.generatedTrackIsrcs }
          : {}),
      }, tx);

      const delivery = await releaseDeliveryRepository.upsertForJob(
        {
          organizationId: job.organizationId,
          jobId: job.id,
          ...(job.providerConfigurationId
            ? { providerConfigurationId: job.providerConfigurationId }
            : {}),
          provider: job.provider,
          releaseId: job.releaseId,
          releaseVersion: job.releaseVersion,
          status: "ACCEPTED",
          externalReleaseId: createResult.data.externalReleaseId,
          submittedAt: new Date(),
        },
        tx,
      );

      await distributionJobRepository.updateStatus(
        job.id,
        {
          status: "SUCCEEDED",
          attemptCount: nextAttemptCount,
          completedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
        tx,
      );

      await providerExternalReferenceRepository.upsert(
        {
          organizationId: job.organizationId,
          provider: job.provider,
          releaseId: job.releaseId,
          referenceType: "RELEASE",
          externalId: createResult.data.externalReleaseId,
          metadata: {
            rawStatus: createResult.data.rawStatus,
          },
        },
        tx,
      );

      await distributionStatusHistoryRepository.create(
        {
          organizationId: job.organizationId,
          jobId: job.id,
          releaseDeliveryId: delivery.id,
          previousStatus: job.status,
          status: "SUCCEEDED",
          message: "Release provider tarafından kabul edildi.",
        },
        tx,
      );

      const isInternalDistribution = job.provider === "INTERNAL";

      await releaseRepository.updateStatus(
        job.releaseId,
        {
          status: isInternalDistribution ? "LIVE" : "DISTRIBUTED",
          previousStatus: "PROCESSING",
          reason: isInternalDistribution
            ? "Yayın Radarune üzerinde canlıya alındı."
            : "Provider release gönderimini kabul etti.",
          metadata: {
            distributionJobId: job.id,
            provider: job.provider,
            externalReleaseId: createResult.data.externalReleaseId,
            radaruneLive: isInternalDistribution,
          },
        },
        tx,
      );

      if (isInternalDistribution) {
        await tx.release.update({
          where: {
            id: job.releaseId,
          },
          data: {
            liveAt: new Date(),
            distributionProvider: "INTERNAL",
          },
        });
      }

      await auditLogService.create(
        {
          organizationId: job.organizationId,
          action: "distribution.job.succeeded",
          entityType: "DistributionJob",
          entityId: job.id,
          metadata: {
            provider: job.provider,
            externalReleaseId: createResult.data.externalReleaseId,
          },
        },
        tx,
      );
    });

    return {
      success: true as const,
      data: {
        processed: true,
        jobId: job.id,
      },
    };
  }

  private async findGeneratedCodeConflict(input: {
    releaseId: string;
    generatedUpc?: string;
    generatedTrackIsrcs?: Array<{ trackId: string; isrc: string }>;
  }) {
    const release = await releaseRepository.findDetailById(input.releaseId);

    if (!release) {
      return "Kod ataması yapılacak yayın bulunamadı.";
    }

    if (input.generatedUpc && release.upc && release.upc !== input.generatedUpc) {
      return "Provider UPC değeri mevcut UPC ile çakışıyor.";
    }

    for (const generated of input.generatedTrackIsrcs ?? []) {
      const track = release.tracks.find((entry) => entry.id === generated.trackId);
      if (track?.isrc && track.isrc !== generated.isrc) {
        return `${track.title} için provider ISRC değeri mevcut ISRC ile çakışıyor.`;
      }
    }

    return null;
  }

  private async applyGeneratedCodes(
    input: {
      releaseId: string;
      generatedUpc?: string;
      generatedTrackIsrcs?: Array<{ trackId: string; isrc: string }>;
    },
    tx: DatabaseClient,
  ) {
    if (input.generatedUpc) {
      await tx.release.updateMany({
        where: {
          id: input.releaseId,
          upc: null,
        },
        data: {
          upc: input.generatedUpc,
        },
      });
    }

    for (const generated of input.generatedTrackIsrcs ?? []) {
      await tx.track.updateMany({
        where: {
          id: generated.trackId,
          releaseId: input.releaseId,
          isrc: null,
        },
        data: {
          isrc: generated.isrc,
        },
      });
    }
  }
}

export const distributionProcessorService = new DistributionProcessorService();
