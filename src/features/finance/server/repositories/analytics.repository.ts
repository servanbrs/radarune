import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import type { AnalyticsFiltersInput } from "@/features/finance/schemas/finance.schema";

function buildStoreRevenueWhere(
  organizationId: string,
  filters: AnalyticsFiltersInput,
  artistIds?: string[] | null,
) {
  const where: Prisma.StoreRevenueWhereInput = {
    organizationId,
  };

  if (filters.periodStart || filters.periodEnd) {
    where.reportDate = {
      ...(filters.periodStart ? { gte: filters.periodStart } : {}),
      ...(filters.periodEnd ? { lte: filters.periodEnd } : {}),
    };
  }

  if (artistIds) {
    where.artistId = {
      in: filters.artistId
        ? artistIds.filter((artistId) => artistId === filters.artistId)
        : artistIds,
    };
  } else if (filters.artistId) {
    where.artistId = filters.artistId;
  }

  if (filters.labelId) {
    where.labelId = filters.labelId;
  }

  if (filters.releaseTitle) {
    where.releaseTitle = filters.releaseTitle;
  }

  if (filters.trackKey) {
    where.trackKey = filters.trackKey;
  }

  if (filters.storeName) {
    where.storeName = filters.storeName;
  }

  if (filters.countryCode) {
    where.countryCode = filters.countryCode;
  }

  return where;
}

export class AnalyticsRepository {
  async getRevenueSummary(
    organizationId: string,
    filters: AnalyticsFiltersInput,
    artistIds?: string[] | null,
  ) {
    return prisma.storeRevenue.aggregate({
      where: buildStoreRevenueWhere(organizationId, filters, artistIds),
      _sum: {
        streamCount: true,
        downloadCount: true,
        grossRevenueMinor: true,
        netRevenueMinor: true,
        playlistAppearances: true,
      },
    });
  }

  async getDailyTrend(
    organizationId: string,
    filters: AnalyticsFiltersInput,
    artistIds?: string[] | null,
  ) {
    return prisma.storeRevenue.groupBy({
      by: ["reportDate"],
      where: buildStoreRevenueWhere(organizationId, filters, artistIds),
      _sum: {
        streamCount: true,
        netRevenueMinor: true,
      },
      orderBy: {
        reportDate: "asc",
      },
    });
  }

  async getCountryDistribution(
    organizationId: string,
    filters: AnalyticsFiltersInput,
    artistIds?: string[] | null,
  ) {
    return prisma.storeRevenue.groupBy({
      by: ["countryCode"],
      where: buildStoreRevenueWhere(organizationId, filters, artistIds),
      _sum: {
        netRevenueMinor: true,
        streamCount: true,
      },
      orderBy: {
        _sum: {
          netRevenueMinor: "desc",
        },
      },
      take: 10,
    });
  }

  async getPlatformDistribution(
    organizationId: string,
    filters: AnalyticsFiltersInput,
    artistIds?: string[] | null,
  ) {
    return prisma.storeRevenue.groupBy({
      by: ["platformName"],
      where: buildStoreRevenueWhere(organizationId, filters, artistIds),
      _sum: {
        netRevenueMinor: true,
        streamCount: true,
      },
      orderBy: {
        _sum: {
          netRevenueMinor: "desc",
        },
      },
      take: 10,
    });
  }

  async getStoreDistribution(
    organizationId: string,
    filters: AnalyticsFiltersInput,
    artistIds?: string[] | null,
  ) {
    return prisma.storeRevenue.groupBy({
      by: ["storeName"],
      where: buildStoreRevenueWhere(organizationId, filters, artistIds),
      _sum: {
        netRevenueMinor: true,
        streamCount: true,
      },
      orderBy: {
        _sum: {
          netRevenueMinor: "desc",
        },
      },
      take: 10,
    });
  }

  async getTopTracks(
    organizationId: string,
    filters: AnalyticsFiltersInput,
    artistIds?: string[] | null,
  ) {
    return prisma.storeRevenue.groupBy({
      by: ["trackKey", "trackTitle"],
      where: buildStoreRevenueWhere(organizationId, filters, artistIds),
      _sum: {
        netRevenueMinor: true,
        streamCount: true,
      },
      orderBy: {
        _sum: {
          netRevenueMinor: "desc",
        },
      },
      take: 10,
    });
  }

  async getTopReleases(
    organizationId: string,
    filters: AnalyticsFiltersInput,
    artistIds?: string[] | null,
  ) {
    return prisma.storeRevenue.groupBy({
      by: ["releaseTitle"],
      where: buildStoreRevenueWhere(organizationId, filters, artistIds),
      _sum: {
        netRevenueMinor: true,
        streamCount: true,
      },
      orderBy: {
        _sum: {
          netRevenueMinor: "desc",
        },
      },
      take: 10,
    });
  }

  async listRevenueDetails(
    organizationId: string,
    filters: AnalyticsFiltersInput,
    artistIds?: string[] | null,
  ) {
    return prisma.storeRevenue.findMany({
      where: buildStoreRevenueWhere(organizationId, filters, artistIds),
      orderBy: [{ reportDate: "desc" }, { netRevenueMinor: "desc" }],
      take: 100,
      select: {
        id: true,
        reportDate: true,
        storeName: true,
        platformName: true,
        countryCode: true,
        currencyCode: true,
        releaseTitle: true,
        trackTitle: true,
        trackKey: true,
        isrc: true,
        upc: true,
        streamCount: true,
        downloadCount: true,
        playlistAppearances: true,
        grossRevenueMinor: true,
        platformFeeMinor: true,
        netRevenueMinor: true,
        artist: { select: { id: true, name: true, slug: true } },
      },
    });
  }
}

export const analyticsRepository = new AnalyticsRepository();
