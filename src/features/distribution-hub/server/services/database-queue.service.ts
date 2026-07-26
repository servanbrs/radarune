import "server-only";
import { distributionJobRepository } from "@/features/distribution-hub/server/repositories/distribution-job.repository";

export class DatabaseDistributionQueueService {
  async enqueue(jobId: string) {
    return distributionJobRepository.updateStatus(jobId, {
      status: "QUEUED",
      queuedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
    });
  }

  async reserve(workerId: string) {
    const now = new Date();
    const lockStaleBefore = new Date(now.getTime() - 5 * 60 * 1000);

    return distributionJobRepository.reserveNextEligibleJob(workerId, lockStaleBefore, now);
  }

  async complete(jobId: string) {
    return distributionJobRepository.updateStatus(jobId, {
      status: "SUCCEEDED",
      completedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      nextAttemptAt: null,
    });
  }

  async fail(jobId: string, errorCode: string, errorMessage: string) {
    return distributionJobRepository.updateStatus(jobId, {
      status: "FAILED",
      lastErrorCode: errorCode,
      lastErrorMessage: errorMessage,
      lockedAt: null,
      lockedBy: null,
    });
  }

  async retry(jobId: string, nextAttemptAt: Date, errorCode: string, errorMessage: string) {
    return distributionJobRepository.updateStatus(jobId, {
      status: "RETRY_SCHEDULED",
      nextAttemptAt,
      lastErrorCode: errorCode,
      lastErrorMessage: errorMessage,
      lockedAt: null,
      lockedBy: null,
    });
  }

  async cancel(jobId: string, reason: string) {
    return distributionJobRepository.updateStatus(jobId, {
      status: "CANCELLED",
      cancelledAt: new Date(),
      lastErrorMessage: reason,
      lockedAt: null,
      lockedBy: null,
    });
  }
}

export const databaseDistributionQueueService = new DatabaseDistributionQueueService();
