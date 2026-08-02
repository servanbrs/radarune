import "server-only";

import { prisma } from "@/server/prisma/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildDailySeries(dates: Date[], numberOfDays: number) {
  const today = startOfDay(new Date());
  const counts = new Map<string, number>();

  for (const date of dates) {
    const key = dayKey(startOfDay(date));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: numberOfDays }, (_, index) => {
    const daysAgo = numberOfDays - index - 1;
    const date = new Date(today.getTime() - daysAgo * DAY_MS);
    const key = dayKey(date);

    return {
      date: key,
      label: date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
      }),
      value: counts.get(key) ?? 0,
    };
  });
}

export type AdminV2Analytics = Awaited<
  ReturnType<AdminV2AnalyticsService["getDashboard"]>
>;

export class AdminV2AnalyticsService {
  async getDashboard(organizationId: string) {
    const now = new Date();
    const today = startOfDay(now);
    const sevenDaysAgo = new Date(today.getTime() - 6 * DAY_MS);
    const thirtyDaysAgo = new Date(today.getTime() - 29 * DAY_MS);
    const activeThreshold = new Date(now.getTime() - 15 * 60 * 1000);

    const [
      users,
      activeUsers,
      releasesToday,
      pendingReleases,
      pendingApplications,
      activeDistributionJobs,
      discoverEventsToday,
      playbackToday,
      dailyReleasesRaw,
      countryDistributionRaw,
      recentAuditLogs,
      releaseStatusRaw,
      jobStatusRaw,
    ] = await Promise.all([
      prisma.user.findMany({
        where: {
          systemRole: {
            in: ["USER", "ARTIST"],
          },
          memberships: {
            some: {
              organizationId,
            },
          },
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          createdAt: true,
        },
      }),

      prisma.session.count({
        where: {
          expiresAt: {
            gt: now,
          },
          updatedAt: {
            gte: activeThreshold,
          },
          user: {
            systemRole: {
              in: ["USER", "ARTIST"],
            },
            memberships: {
              some: {
                organizationId,
              },
            },
          },
        },
      }),

      prisma.release.count({
        where: {
          organizationId,
          createdAt: {
            gte: today,
          },
        },
      }),

      prisma.release.count({
        where: {
          organizationId,
          status: {
            in: [
              "PENDING_REVIEW",
              "REVISION_REQUESTED",
              "QUEUED",
              "PROCESSING",
            ],
          },
        },
      }),

      prisma.artistApplication.count({
        where: {
          organizationId,
          status: {
            in: ["PENDING", "UNDER_REVIEW"],
          },
        },
      }),

      prisma.distributionJob.count({
        where: {
          organizationId,
          status: {
            in: [
              "PENDING",
              "VALIDATING",
              "QUEUED",
              "PROCESSING",
              "WAITING_PROVIDER",
              "RETRY_SCHEDULED",
              "MANUAL_REVIEW",
            ],
          },
        },
      }),

      prisma.discoverEvent.count({
        where: {
          organizationId,
          user: {
            systemRole: {
              in: ["USER", "ARTIST"],
            },
          },
          createdAt: {
            gte: today,
          },
        },
      }),

      prisma.playbackSession.count({
        where: {
          organizationId,
          streamCountedAt: {
            gte: today,
          },
        },
      }),

      prisma.release.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          createdAt: true,
        },
      }),

      prisma.storeRevenue.groupBy({
        by: ["countryCode"],
        where: {
          organizationId,
        },
        _sum: {
          streamCount: true,
          netRevenueMinor: true,
        },
        orderBy: {
          _sum: {
            streamCount: "desc",
          },
        },
        take: 12,
      }),

      prisma.auditLog.findMany({
        where: {
          organizationId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          action: true,
          entityType: true,
          createdAt: true,
          actorUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      prisma.release.groupBy({
        by: ["status"],
        where: {
          organizationId,
        },
        _count: {
          _all: true,
        },
      }),

      prisma.distributionJob.groupBy({
        by: ["status"],
        where: {
          organizationId,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const usersToday = users.filter((user) => user.createdAt >= today).length;

    const usersSevenDays = users.filter(
      (user) => user.createdAt >= sevenDaysAgo,
    ).length;

    const countries = countryDistributionRaw.map((country) => ({
      code: country.countryCode,
      streams: country._sum.streamCount ?? 0,
      revenueMinor: Number(country._sum.netRevenueMinor ?? 0n),
    }));

    return {
      generatedAt: now.toISOString(),

      summary: {
        activeUsers,
        usersToday,
        usersSevenDays,
        releasesToday,
        pendingReleases,
        pendingApplications,
        activeDistributionJobs,
        discoverEventsToday,
        playbackToday,
      },

      charts: {
        dailyUsers: buildDailySeries(
          users.map((user) => user.createdAt),
          30,
        ),
        dailyReleases: buildDailySeries(
          dailyReleasesRaw.map((release) => release.createdAt),
          30,
        ),
        countries,
        releaseStatuses: releaseStatusRaw.map((item) => ({
          name: item.status,
          value: item._count._all,
        })),
        distributionStatuses: jobStatusRaw.map((item) => ({
          name: item.status,
          value: item._count._all,
        })),
      },

      recentActivities: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        createdAt: log.createdAt.toISOString(),
        actor: log.actorUser?.name ?? log.actorUser?.email ?? "Sistem",
      })),
    };
  }
}

export const adminV2AnalyticsService = new AdminV2AnalyticsService();
