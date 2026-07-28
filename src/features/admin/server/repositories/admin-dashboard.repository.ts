import "server-only";
import { prisma } from "@/server/prisma/prisma";

const sevenDaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  date.setHours(0, 0, 0, 0);
  return date;
};

export class AdminDashboardRepository {
  async getStats(organizationId: string) {
    const since = sevenDaysAgo();

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      approvedArtists,
      pendingApplications,
      draftReleases,
      pendingReviewReleases,
      revisionReleases,
      approvedReleases,
      queuedReleases,
      liveReleases,
      failedDistributionJobs,
      recentDistributionErrors,
      recentAuditLogs,
      totalDistributionJobs,
      recentUsers,
      popularReleases,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
      prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
      prisma.user.count({ where: { accountStatus: "BANNED" } }),
      prisma.artist.count({ where: { organizationId } }),
      prisma.artistApplication.count({
        where: { organizationId, status: { in: ["PENDING", "UNDER_REVIEW"] } },
      }),
      prisma.release.count({ where: { organizationId, status: "DRAFT" } }),
      prisma.release.count({ where: { organizationId, status: "PENDING_REVIEW" } }),
      prisma.release.count({ where: { organizationId, status: "REVISION_REQUESTED" } }),
      prisma.release.count({ where: { organizationId, status: "APPROVED" } }),
      prisma.release.count({ where: { organizationId, status: "QUEUED" } }),
      prisma.release.count({ where: { organizationId, status: "LIVE" } }),
      prisma.distributionJob.count({ where: { organizationId, status: "FAILED" } }),
      prisma.distributionJob.findMany({
        where: { organizationId, status: "FAILED" },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          provider: true,
          releaseTitle: true,
          lastErrorCode: true,
          lastErrorMessage: true,
          updatedAt: true,
        },
      }),
      prisma.auditLog.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          actorUser: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.distributionJob.count({ where: { organizationId } }),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, createdAt: true } }),
      prisma.release.findMany({ where: { organizationId }, orderBy: { releaseLikes: { _count: "desc" } }, take: 5, select: { id: true, title: true, _count: { select: { releaseLikes: true } } } }),
    ]);

    const [dailyUsers, dailyReleases, releaseStatusDistribution, jobStatusDistribution] =
      await Promise.all([
        prisma.user.groupBy({
          by: ["createdAt"],
          where: { createdAt: { gte: since } },
          _count: { _all: true },
        }),
        prisma.release.groupBy({
          by: ["createdAt"],
          where: { organizationId, submittedAt: { gte: since } },
          _count: { _all: true },
        }),
        prisma.release.groupBy({
          by: ["status"],
          where: { organizationId },
          _count: { _all: true },
        }),
        prisma.distributionJob.groupBy({
          by: ["status"],
          where: { organizationId },
          _count: { _all: true },
        }),
      ]);

    return {
      cards: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        bannedUsers,
        approvedArtists,
        pendingApplications,
        draftReleases,
        pendingReviewReleases,
        revisionReleases,
        approvedReleases,
        queuedReleases,
        liveReleases,
        failedDistributionJobs,
      },
      dailyUsers: this.bucketByDay(dailyUsers),
      dailyReleases: this.bucketByDay(dailyReleases),
      releaseStatusDistribution,
      jobStatusDistribution,
      recentDistributionErrors,
      recentAuditLogs,
      totalDistributionJobs,
      recentUsers,
      popularReleases,
    };
  }

  private bucketByDay(rows: Array<{ createdAt: Date; _count: { _all: number } }>) {
    return rows.reduce<Record<string, number>>((result, row) => {
      const key = row.createdAt.toISOString().slice(0, 10);
      return { ...result, [key]: (result[key] ?? 0) + row._count._all };
    }, {});
  }
}

export const adminDashboardRepository = new AdminDashboardRepository();
