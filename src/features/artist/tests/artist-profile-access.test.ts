import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, findMany } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/prisma/prisma", () => ({
  prisma: { artist: { findFirst, findMany } },
}));
vi.mock("@/features/finance/server/services/audit-log.service", () => ({
  auditLogService: { create: vi.fn() },
}));

import { ArtistProfileService } from "@/features/artist/server/services/artist-profile.service";

describe("ArtistProfileService editor access", () => {
  beforeEach(() => {
    findFirst.mockReset();
    findMany.mockReset();
  });

  it("normal kullanıcı sorgusunu sahiplik veya yetkili ekip üyeliğiyle sınırlar", async () => {
    findFirst.mockResolvedValue(null);

    const result = await new ArtistProfileService().getEditable({
      organizationId: "org_1",
      userId: "user_1",
      systemRole: "USER",
      artistId: "artist_1",
    });

    expect(result).toBeNull();
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: "artist_1",
        organizationId: "org_1",
        OR: [
          { ownerUserId: "user_1" },
          {
            teamMembers: {
              some: {
                userId: "user_1",
                role: { in: ["OWNER", "MANAGER", "EDITOR"] },
              },
            },
          },
        ],
      },
    }));
  });

  it("platform yöneticisinin aynı organizasyondaki sanatçıyı yönetmesine izin verir", async () => {
    findFirst.mockResolvedValue({ id: "artist_1" });

    await new ArtistProfileService().getEditable({
      organizationId: "org_1",
      userId: "admin_1",
      systemRole: "ADMIN",
      artistId: "artist_1",
    });

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "artist_1", organizationId: "org_1" },
    }));
  });
});
