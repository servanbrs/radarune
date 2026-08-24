import "server-only";

import { prisma } from "@/server/prisma/prisma";

export class DashboardRepository {
  async getOverview(
    organizationId: string,
    scope: { artistIds?: string[] | null; userId?: string } = {},
  ) {
    // `null` means an organization-wide view (admin/label). An array means
    // the caller can only see data belonging to those artist channels. An
    // empty array intentionally produces an empty personal dashboard.
    const artistIds = scope.artistIds === undefined ? null : scope.artistIds;
    const releaseScope =
      artistIds === null
        ? {}
        : { artists: { some: { artistId: { in: artistIds } } } };
    const scopedReleaseIds =
      artistIds === null
        ? null
        : await prisma.release.findMany({
            where: { organizationId, ...releaseScope },
            select: { id: true },
          });
    const releaseIds = scopedReleaseIds?.map((release) => release.id) ?? null;
    const releaseIdFilter =
      releaseIds === null ? {} : { releaseId: { in: releaseIds } };
    const artistIdFilter =
      artistIds === null ? {} : { artistId: { in: artistIds } };
    const smartLinkFilter =
      artistIds === null ? {} : { smartLink: { artistId: { in: artistIds } } };
    const activityFilter =
      artistIds === null
        ? { organizationId }
        : scope.userId
          ? { organizationId, actorUserId: scope.userId }
          : { organizationId, actorUserId: { equals: null } };

    const [
      releaseStatusDistribution,
      revenueSummary,
      recentReleases,
      recentAuditLogs,
      failedDistributionJobs,
      smartLinkCount,
      smartLinkViews,
      smartLinkClicks,
      audienceCountries,
      audienceCities,
      audienceSources,
    ] = await Promise.all([
      prisma.release.groupBy({
        by: ["status"],
        where: {
          organizationId,
          ...releaseScope,
        },
        _count: {
          _all: true,
        },
      }),

      prisma.storeRevenue.aggregate({
        where: {
          organizationId,
          ...artistIdFilter,
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
          ...releaseScope,
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
        where: activityFilter,
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
          ...releaseIdFilter,
        },
      }),

      prisma.smartLink.count({
        where: { organizationId, active: true, ...artistIdFilter },
      }),
      prisma.smartLinkView.count({ where: { organizationId, ...smartLinkFilter } }),
      prisma.smartLinkClick.count({ where: { organizationId, ...smartLinkFilter } }),
      prisma.smartLinkView.groupBy({
        by: ["country"],
        where: {
          organizationId,
          country: { not: null },
          ...smartLinkFilter,
        },
        _count: { _all: true },
        orderBy: { _count: { country: "desc" } },
        take: 5,
      }),
      prisma.smartLinkView.groupBy({
        by: ["city"],
        where: {
          organizationId,
          city: { not: null },
          ...smartLinkFilter,
        },
        _count: { _all: true },
        orderBy: { _count: { city: "desc" } },
        take: 5,
      }),
      prisma.smartLinkView.groupBy({
        by: ["utmSource"],
        where: {
          organizationId,
          utmSource: { not: null },
          ...smartLinkFilter,
        },
        _count: { _all: true },
        orderBy: { _count: { utmSource: "desc" } },
        take: 6,
      }),
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
        audienceCountries,
        audienceCities,
        audienceSources,
      },
      recentReleases,
      recentAuditLogs,
    };
  }
}

export const dashboardRepository = new DashboardRepository();
