import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getRevenueSummary = vi.fn();
const getDailyTrend = vi.fn();
const getCountryDistribution = vi.fn();
const getPlatformDistribution = vi.fn();
const getStoreDistribution = vi.fn();
const getTopTracks = vi.fn();
const getTopReleases = vi.fn();
const listRevenueDetails = vi.fn();
const listAccessibleArtistIds = vi.fn();

vi.mock("@/features/finance/server/repositories/analytics.repository", () => ({
  analyticsRepository: {
    getRevenueSummary,
    getDailyTrend,
    getCountryDistribution,
    getPlatformDistribution,
    getStoreDistribution,
    getTopTracks,
    getTopReleases,
    listRevenueDetails,
  },
}));
vi.mock("@/features/finance/server/services/finance-access.service", () => ({
  financeAccessService: {
    listAccessibleArtistIds,
  },
}));

describe("analyticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getRevenueSummary.mockResolvedValue({
      _sum: {
        streamCount: 10,
        downloadCount: 1,
        grossRevenueMinor: BigInt(1000),
        netRevenueMinor: BigInt(900),
        playlistAppearances: 2,
      },
    });
    getDailyTrend.mockResolvedValue([]);
    getCountryDistribution.mockResolvedValue([]);
    getPlatformDistribution.mockResolvedValue([]);
    getStoreDistribution.mockResolvedValue([]);
    getTopTracks.mockResolvedValue([]);
    getTopReleases.mockResolvedValue([]);
    listRevenueDetails.mockResolvedValue([]);
    listAccessibleArtistIds.mockResolvedValue(["artist_1"]);
  });

  it("member scope için accessible artist filtrelerini kullanır", async () => {
    const { analyticsService } = await import(
      "@/features/finance/server/services/analytics.service"
    );

    const result = await analyticsService.getDashboard(
      {
        organizationId: "org_1",
        membershipRole: "MEMBER",
        systemRole: "USER",
        userId: "user_1",
      },
      {},
    );

    expect(result.summary.streams).toBe(10);
    expect(getRevenueSummary).toHaveBeenCalledWith("org_1", {}, ["artist_1"]);
  });
});
