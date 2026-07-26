import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { aiProviderRegistry } from "@/features/intelligence/server/adapters/ai-provider-registry";

const deterministicJobTypes = new Set([
  "ARTWORK_ANALYSIS",
  "AUDIO_ANALYSIS",
  "AUDIO_FINGERPRINT",
  "DUPLICATE_DETECTION",
  "READINESS_SCORE",
  "PROVIDER_COMPATIBILITY",
]);

export class IntelligenceWorkerService {
  async processNext(workerId: string) {
    const job = await prisma.aiAnalysisJob.findFirst({
      where: {
        status: { in: ["PENDING", "QUEUED", "RETRY_SCHEDULED"] },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      include: { provider: true },
    });

    if (!job) {
      return null;
    }

    const attemptNumber = job.attemptCount + 1;
    const startedAt = new Date();
    await prisma.aiAnalysisJob.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
        lockedAt: startedAt,
        lockedBy: workerId,
        startedAt,
        attemptCount: { increment: 1 },
      },
    });

    const attempt = await prisma.aiAnalysisAttempt.create({
      data: {
        organizationId: job.organizationId,
        jobId: job.id,
        providerId: job.providerId,
        actorUserId: job.requestedByUserId,
        attemptNumber,
        status: "PROCESSING",
        retryable: false,
      },
    });

    if (deterministicJobTypes.has(job.jobType)) {
      return this.complete(job.id, attempt.id, startedAt);
    }

    const providerCode = job.provider?.code ?? "INTERNAL_RULE_ENGINE";
    const provider = aiProviderRegistry.get(providerCode);
    const configuration = await provider.validateConfiguration();

    if (!configuration.success) {
      return this.configurationRequired(job.id, attempt.id, startedAt, configuration.code, configuration.message);
    }

    return this.configurationRequired(
      job.id,
      attempt.id,
      startedAt,
      "CONFIGURATION_REQUIRED",
      "Harici AI provider bağlı olsa bile bu job tipi için üretim adapter uygulaması tamamlanmadan sonuç üretilmez.",
    );
  }

  private async complete(jobId: string, attemptId: string, startedAt: Date) {
    const finishedAt = new Date();
    await prisma.$transaction([
      prisma.aiAnalysisAttempt.update({
        where: { id: attemptId },
        data: {
          status: "COMPLETED",
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
        },
      }),
      prisma.aiAnalysisJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          completedAt: finishedAt,
          lockedAt: null,
          lockedBy: null,
        },
      }),
    ]);

    return { jobId, status: "COMPLETED" as const };
  }

  private async configurationRequired(jobId: string, attemptId: string, startedAt: Date, code: string, message: string) {
    const finishedAt = new Date();
    await prisma.$transaction([
      prisma.aiAnalysisAttempt.update({
        where: { id: attemptId },
        data: {
          status: "CONFIGURATION_REQUIRED",
          retryable: false,
          errorCode: code,
          errorMessage: message,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
        },
      }),
      prisma.aiAnalysisJob.update({
        where: { id: jobId },
        data: {
          status: "CONFIGURATION_REQUIRED",
          lastErrorCode: code,
          lastErrorMessage: message,
          lockedAt: null,
          lockedBy: null,
        },
      }),
    ]);

    return { jobId, status: "CONFIGURATION_REQUIRED" as const, message };
  }
}

export const intelligenceWorkerService = new IntelligenceWorkerService();
