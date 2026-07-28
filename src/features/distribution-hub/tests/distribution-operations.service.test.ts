import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { createAuditLog, listDeadLetterJobs, requeueDeadLetterJob } = vi.hoisted(
  () => ({
    createAuditLog: vi.fn(),
    listDeadLetterJobs: vi.fn(),
    requeueDeadLetterJob: vi.fn(),
  }),
);

vi.mock("@/features/finance/server/services/audit-log.service", () => ({
  auditLogService: {
    create: createAuditLog,
  },
}));

vi.mock(
  "@/features/distribution-hub/server/services/database-queue.service",
  () => ({
    databaseDistributionQueueService: {
      listDeadLetterJobs,
      requeueDeadLetterJob,
    },
  }),
);

import { distributionOperationsService } from "@/features/distribution-hub/server/services/distribution-operations.service";

const adminActor = {
  organizationId: "org_1",
  membershipRole: "OWNER" as const,
  systemRole: "SUPER_ADMIN" as const,
  userId: "user_1",
};

describe("DistributionOperationsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dead-letter listesini organization scope ile yükler", async () => {
    listDeadLetterJobs.mockResolvedValue([]);

    await distributionOperationsService.listDeadLetterJobs(adminActor, 25);

    expect(listDeadLetterJobs).toHaveBeenCalledWith("org_1", 25);
  });

  it("job'ı tenant scope içinde requeue eder ve audit log oluşturur", async () => {
    requeueDeadLetterJob.mockResolvedValue({
      id: "job_1",
      provider: "INTERNAL",
      releaseId: "release_1",
    });

    await expect(
      distributionOperationsService.requeueDeadLetterJob(adminActor, " job_1 "),
    ).resolves.toMatchObject({ id: "job_1" });

    expect(requeueDeadLetterJob).toHaveBeenCalledWith("job_1", "org_1");
    expect(createAuditLog).toHaveBeenCalledWith({
      organizationId: "org_1",
      actorUserId: "user_1",
      action: "distribution.job.requeue",
      entityType: "DistributionJob",
      entityId: "job_1",
      metadata: {
        previousStatus: "MANUAL_REVIEW",
        nextStatus: "QUEUED",
        provider: "INTERNAL",
        releaseId: "release_1",
      },
    });
  });

  it("scope dışında veya uygun durumda olmayan job için audit üretmez", async () => {
    requeueDeadLetterJob.mockResolvedValue(null);

    await expect(
      distributionOperationsService.requeueDeadLetterJob(adminActor, "job_2"),
    ).resolves.toBeNull();

    expect(createAuditLog).not.toHaveBeenCalled();
  });
});
