import "server-only";
import { analyticsFiltersSchema, type AnalyticsFiltersInput } from "@/features/finance/schemas/finance.schema";
import { rbacService } from "@/features/authorization/server/rbac";
import { analyticsRepository } from "@/features/finance/server/repositories/analytics.repository";
import {
  financeAccessService,
  type FinanceActorContext,
} from "@/features/finance/server/services/finance-access.service";

function assertAnalyticsAccess(actor: FinanceActorContext) {
  const hasPermission =
    rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "analytics:view:own",
      systemRole: actor.systemRole,
    }) ||
    rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "analytics:view:label",
      systemRole: actor.systemRole,
    }) ||
    rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "analytics:view:all",
      systemRole: actor.systemRole,
    });

  if (!hasPermission) {
    throw new Error("Analytics verilerini görüntüleme yetkiniz yok.");
  }
}

export class AnalyticsService {
  async getDashboard(actor: FinanceActorContext, input: AnalyticsFiltersInput) {
    assertAnalyticsAccess(actor);

    const filters = analyticsFiltersSchema.parse(input);
    const accessibleArtistIds = await financeAccessService.listAccessibleArtistIds(actor);

    const [
      summary,
      dailyTrend,
      countryDistribution,
      platformDistribution,
      storeDistribution,
      topTracks,
      topReleases,
    ] = await Promise.all([
      analyticsRepository.getRevenueSummary(
        actor.organizationId,
        filters,
        accessibleArtistIds,
      ),
      analyticsRepository.getDailyTrend(actor.organizationId, filters, accessibleArtistIds),
      analyticsRepository.getCountryDistribution(
        actor.organizationId,
        filters,
        accessibleArtistIds,
      ),
      analyticsRepository.getPlatformDistribution(
        actor.organizationId,
        filters,
        accessibleArtistIds,
      ),
      analyticsRepository.getStoreDistribution(
        actor.organizationId,
        filters,
        accessibleArtistIds,
      ),
      analyticsRepository.getTopTracks(actor.organizationId, filters, accessibleArtistIds),
      analyticsRepository.getTopReleases(actor.organizationId, filters, accessibleArtistIds),
    ]);

    return {
      summary: {
        streams: summary._sum.streamCount ?? 0,
        downloads: summary._sum.downloadCount ?? 0,
        grossRevenueMinor: summary._sum.grossRevenueMinor ?? 0n,
        netRevenueMinor: summary._sum.netRevenueMinor ?? 0n,
        playlistAppearances: summary._sum.playlistAppearances ?? 0,
      },
      charts: {
        dailyTrend,
        countryDistribution,
        platformDistribution,
        storeDistribution,
      },
      rankings: {
        topTracks,
        topReleases,
      },
      filters,
    };
  }
}

export const analyticsService = new AnalyticsService();
