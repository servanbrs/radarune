import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/prisma/prisma", () => ({ prisma: {} }));

import { ArtistApplicationRepository } from "@/features/admin/server/repositories/artist-application.repository";

describe("ArtistApplicationRepository status guard", () => {
  it("stale veya başka tenant başvurusunu güncelleyemez", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const client = { artistApplication: { updateMany } } as never;

    await expect(new ArtistApplicationRepository().updateStatus({
      id: "application_1",
      organizationId: "org_1",
      previousStatus: "PENDING",
      status: "UNDER_REVIEW",
      actorUserId: "admin_1",
    }, client)).rejects.toThrow("Başvuru durumu değişti");

    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "application_1", organizationId: "org_1", status: "PENDING" },
    }));
  });
});
