import "server-only";

import { prisma } from "@/server/prisma/prisma";

export class DashboardRepository {
  async getOverview(organizationId: string) {
    const [
      releaseStatusDistribution,
      revenueSummary,
      recentReleases,
      recentAuditLogs,
      failedDistributionJobs,
      smartLinkCount,
      smartLinkViews,
      smartLinkClicks,
    ] = await Promise.all([
      prisma.release.groupBy({
        by: ["status"],
        where: {
          organizationId,
        },
        _count: {
          _all: true,
        },
      }),

      prisma.storeRevenue.aggregate({
        where: {
          organizationId,
        },
        _sum: {
          streamCount: true,
          downloadCount: true,
          netRevenueMinor: true,
          playlistAppearances: true,
        },
      }),

      prisma.release.findMany({
        where: {
          organizationId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          artworkUploadId: true,
          plannedReleaseDate: true,
          updatedAt: true,
          artists: {
            take: 1,
            select: {
              artist: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),

      prisma.auditLog.findMany({
        where: {
          organizationId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          action: true,
          entityType: true,
          createdAt: true,
          actorUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),

      prisma.distributionJob.count({
        where: {
          organizationId,
          status: "FAILED",
        },
      }),

      prisma.smartLink.count({ where: { organizationId, active: true } }),
      prisma.smartLinkView.count({ where: { organizationId } }),
      prisma.smartLinkClick.count({ where: { organizationId } }),
    ]);

    const releaseCounts = releaseStatusDistribution.reduce<
      Record<string, number>
    >((result, row) => {
      result[row.status] = row._count._all;
      return result;
    }, {});

    const totalReleases = releaseStatusDistribution.reduce(
      (total, row) => total + row._count._all,
      0,
    );

    return {
      stats: {
        totalReleases,
        liveReleases: releaseCounts.LIVE ?? 0,
        draftReleases: releaseCounts.DRAFT ?? 0,
        pendingReviewReleases: releaseCounts.PENDING_REVIEW ?? 0,
        revisionReleases: releaseCounts.REVISION_REQUESTED ?? 0,
        failedDistributionJobs,
        streams: revenueSummary._sum.streamCount ?? 0,
        downloads: revenueSummary._sum.downloadCount ?? 0,
        playlistAppearances:
          revenueSummary._sum.playlistAppearances ?? 0,
        netRevenueMinor: revenueSummary._sum.netRevenueMinor ?? 0n,
        activeSmartLinks: smartLinkCount,
        smartLinkViews,
        smartLinkClicks,
      },
      recentReleases,
      recentAuditLogs,
    };
  }
}

export const dashboardRepository = new DashboardRepository();
