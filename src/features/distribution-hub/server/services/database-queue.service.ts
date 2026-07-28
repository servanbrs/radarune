import "server-only";

import { distributionJobRepository } from "@/features/distribution-hub/server/repositories/distribution-job.repository";

const DISTRIBUTION_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export class DatabaseDistributionQueueService {
  /**
   * Bir job'ı işlem kuyruğuna ekler veya yeniden kuyruğa alır.
   */
  async enqueue(jobId: string) {
    const now = new Date();

    return distributionJobRepository.updateStatus(jobId, {
      status: "QUEUED",
      queuedAt: now,
      completedAt: null,
      cancelledAt: null,
      nextAttemptAt: null,
      lockedAt: null,
      lockedBy: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    });
  }

  /**
   * İşlenmeye uygun ilk job'ı worker adına atomik olarak rezerve eder.
   *
   * Beş dakikadan eski worker kilitleri stale kabul edilir.
   */
  async reserve(workerId: string) {
    const normalizedWorkerId = workerId.trim();

    if (!normalizedWorkerId) {
      throw new Error("Distribution worker kimliği boş olamaz.");
    }

    const now = new Date();
    const lockStaleBefore = new Date(
      now.getTime() - DISTRIBUTION_LOCK_TIMEOUT_MS,
    );

    return distributionJobRepository.reserveNextEligibleJob(
      normalizedWorkerId,
      lockStaleBefore,
      now,
    );
  }

  /**
   * Job'ı başarıyla tamamlandı olarak işaretler.
   */
  async complete(jobId: string) {
    return distributionJobRepository.updateStatus(jobId, {
      status: "SUCCEEDED",
      completedAt: new Date(),
      cancelledAt: null,
      nextAttemptAt: null,
      lockedAt: null,
      lockedBy: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    });
  }

  /**
   * Job'ı tekrar denenmeyecek şekilde başarısız olarak işaretler.
   */
  async fail(
    jobId: string,
    errorCode: string,
    errorMessage: string,
  ) {
    return distributionJobRepository.updateStatus(jobId, {
      status: "FAILED",
      completedAt: new Date(),
      nextAttemptAt: null,
      lockedAt: null,
      lockedBy: null,
      lastErrorCode: errorCode,
      lastErrorMessage: errorMessage,
    });
  }

  /**
   * Job için sonraki otomatik deneme zamanını planlar.
   */
  async retry(
    jobId: string,
    nextAttemptAt: Date,
    errorCode: string,
    errorMessage: string,
  ) {
    if (nextAttemptAt.getTime() <= Date.now()) {
      throw new Error(
        "Distribution retry zamanı gelecekte olmalıdır.",
      );
    }

    return distributionJobRepository.updateStatus(jobId, {
      status: "RETRY_SCHEDULED",
      completedAt: null,
      cancelledAt: null,
      nextAttemptAt,
      lockedAt: null,
      lockedBy: null,
      lastErrorCode: errorCode,
      lastErrorMessage: errorMessage,
    });
  }

  /**
   * Job'ı iptal eder ve tekrar rezerve edilmesini engeller.
   */
  async listDeadLetterJobs(
    organizationId: string,
    take = 50,
  ) {
    return distributionJobRepository.listDeadLetterJobs(
      organizationId,
      take,
    );
  }

  async requeueDeadLetterJob(
    jobId: string,
    organizationId: string,
  ) {
    return distributionJobRepository.requeueDeadLetterJob(
      jobId,
      organizationId,
    );
  }

  
  async heartbeat(
    jobId: string,
    workerId: string,
  ) {
    return distributionJobRepository.heartbeat(
      jobId,
      workerId,
    );
  }

async cancel(jobId: string, reason: string) {
    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      throw new Error("Distribution iptal nedeni boş olamaz.");
    }

    return distributionJobRepository.updateStatus(jobId, {
      status: "CANCELLED",
      cancelledAt: new Date(),
      completedAt: null,
      nextAttemptAt: null,
      lockedAt: null,
      lockedBy: null,
      lastErrorCode: "JOB_CANCELLED",
      lastErrorMessage: normalizedReason,
    });
  }
}

export const databaseDistributionQueueService =
  new DatabaseDistributionQueueService();
