import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const groupBy = vi.fn();

vi.mock("@/server/prisma/prisma", () => ({
  prisma: {
    storeRevenue: {
      aggregate: vi.fn(),
      groupBy,
    },
  },
}));

describe("analyticsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    groupBy.mockResolvedValue([]);
  });

  it("platform dağılımı sorgusunda performans sınırı olarak take=10 kullanır", async () => {
    const { analyticsRepository } = await import(
      "@/features/finance/server/repositories/analytics.repository"
    );

    await analyticsRepository.getPlatformDistribution(
      "org_1",
      {
        periodStart: new Date("2026-07-01T00:00:00.000Z"),
        periodEnd: new Date("2026-07-24T00:00:00.000Z"),
      },
      ["artist_1"],
    );

    expect(groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["platformName"],
        take: 10,
        orderBy: {
          _sum: {
            netRevenueMinor: "desc",
          },
        },
      }),
    );
  });
});
