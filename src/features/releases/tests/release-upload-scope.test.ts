import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/prisma/prisma", () => ({ prisma: {} }));

import { ReleaseRepository } from "@/features/releases/server/repositories/release.repository";

describe("ReleaseRepository.attachUpload", () => {
  it("başka organization dosyasını ilişkilendirmeyi reddeder", async () => {
    const client = {
      upload: { findFirst: vi.fn().mockResolvedValue(null) },
      track: { findFirst: vi.fn() },
      release: { updateMany: vi.fn() },
    } as never;

    await expect(new ReleaseRepository().attachUpload({
      releaseId: "release_1",
      organizationId: "org_1",
      uploadId: "upload_from_org_2",
      kind: "ARTWORK",
    }, client)).rejects.toThrow("bu organizasyona ait değil");
  });

  it("submission için organization ve beklenen status ile atomic guard kullanır", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const client = {
      release: { updateMany },
      releaseStatusHistory: { create: vi.fn() },
    } as never;

    await expect(new ReleaseRepository().submitRelease({
      releaseId: "release_1",
      organizationId: "org_1",
      actorUserId: "user_1",
      expectedPreviousStatus: "DRAFT",
    }, client)).rejects.toThrow("Yayın durumu değişti");

    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: "release_1",
        organizationId: "org_1",
        status: "DRAFT",
      },
    }));
  });
});
