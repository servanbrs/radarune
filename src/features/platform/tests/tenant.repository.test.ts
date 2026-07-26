import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const findFirst = vi.fn();
vi.mock("@/server/prisma/prisma", () => ({ prisma: { organization: { findFirst } } }));

describe("TenantRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("host çözümlemesini yalnızca aktif tenant scope ile yapar", async () => {
    const { tenantRepository } = await import("@/features/platform/server/repositories/tenant.repository");
    findFirst.mockResolvedValue(null);
    await tenantRepository.findByHost("music.example.com");
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantStatus: { in: ["ACTIVE", "MAINTENANCE"] } }) }));
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ OR: expect.arrayContaining([{ primaryDomain: "music.example.com" }]) }) }));
  });
});
