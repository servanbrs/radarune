import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { MobileRouteActor } from "@/features/mobile/server/http/mobile-route";
import { analyticsService } from "@/features/finance/server/services/analytics.service";

export class MobileDashboardService {
  async getDashboard(actor: MobileRouteActor) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [
      totalReleases,
      pendingReviewReleases,
      liveReleases,
      revisionReleases,
      failedDistributionJobs,
      recentReleases,
      unreadNotifications,
      analytics,
      latestPayout,
    ] = await Promise.all([
      prisma.release.count({ where: { organizationId: actor.organizationId } }),
      prisma.release.count({ where: { organizationId: actor.organizationId, status: "PENDING_REVIEW" } }),
      prisma.release.count({ where: { organizationId: actor.organizationId, status: "LIVE" } }),
      prisma.release.count({ where: { organizationId: actor.organizationId, status: "REVISION_REQUESTED" } }),
      prisma.distributionJob.count({ where: { organizationId: actor.organizationId, status: "FAILED" } }),
      prisma.release.findMany({
        where: { organizationId: actor.organizationId },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
      prisma.notification.count({ where: { userId: actor.userId, readAt: null } }),
      analyticsService.getDashboard(actor, { periodStart: monthStart, periodEnd: now }),
      prisma.payout.findFirst({
        where: { organizationId: actor.organizationId },
        orderBy: { requestedAt: "desc" },
        select: { id: true, status: true, amountMinor: true, currencyCode: true, requestedAt: true },
      }),
    ]);

    return {
      cards: {
        totalReleases,
        pendingReviewReleases,
        liveReleases,
        revisionReleases,
        failedDistributionJobs,
        unreadNotifications,
        monthlyStreams: analytics.summary.streams,
        monthlyRevenueMinor: analytics.summary.netRevenueMinor,
      },
      recentActivity: recentReleases,
      latestPayout,
    };
  }
}

export const mobileDashboardService = new MobileDashboardService();
