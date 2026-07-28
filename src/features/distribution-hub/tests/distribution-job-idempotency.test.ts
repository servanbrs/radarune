import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/prisma/prisma", () => ({ prisma: {} }));

import { DistributionJobRepository } from "@/features/distribution-hub/server/repositories/distribution-job.repository";

describe("DistributionJobRepository idempotency", () => {
  it("idempotency key ile tenant scoped mevcut job'ı bulur", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "job_1",
      status: "QUEUED",
      organizationId: "org_1",
    });

    const result = await new DistributionJobRepository().findByIdempotencyKey("key_1", {
      distributionJob: { findUnique },
    } as never);

    expect(result).toEqual({ id: "job_1", status: "QUEUED", organizationId: "org_1" });
    expect(findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: "key_1" },
      select: { id: true, status: true, organizationId: true },
    });
  });
});
