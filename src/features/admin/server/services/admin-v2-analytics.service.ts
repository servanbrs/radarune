import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { isSiteVisitTableAvailable } from "@/features/analytics/server/site-visit-availability";
import { hashPrivacyValue } from "@/features/growth/server/security.server";
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

function maskIpAddress(value: string | null) {
  if (!value) return "IP bilgisi yok";
  if (value.includes(":")) {
    const parts = value.split(":");
    return `${parts.slice(0, 2).join(":")}::…`;
  }
  const parts = value.split(".");
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.xxx.xxx` : "Maskeli IP";
}

function countryLabel(value: string | null) {
  if (!value) return "Bilinmiyor";
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return value;

  try {
    const name = new Intl.DisplayNames(["tr"], { type: "region" }).of(code);
    return name && name !== code ? `${name} (${code})` : code;
  } catch {
    return code;
  }
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
    const siteVisitTableAvailablePromise = isSiteVisitTableAvailable();
    // Yeni kayıtlar, ilk doğrulama tamamlanmadan kısa bir süre memberships
    // satırı olmadan bulunabilir. Bunları analizlerden düşürmemek için mevcut
    // organizasyon üyelerini ve henüz organizasyona bağlanmamış hesapları
    // birlikte sayıyoruz; böylece toplam ve son 7 günlük kayıtlar eksilmez.
    const endUserScope: Prisma.UserWhereInput = {
      OR: [
        { memberships: { some: { organizationId } } },
        { memberships: { none: {} } },
      ],
    };

    const [
      users,
      totalUsers,
      activeUsers,
      activeSessions,
      recentRegistrations,
      recentReleases,
      distributionQueue,
      releasesToday,
      pendingReleases,
      pendingApplications,
      activeDistributionJobs,
      discoverEventsToday,
      playbackToday,
      dailyReleasesRaw,
      countryDistributionRaw,
      royaltyCountryRaw,
      liveCountryRaw,
      recentAuditLogs,
      releaseStatusRaw,
      jobStatusRaw,
    ] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...endUserScope,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          createdAt: true,
        },
      }),

      prisma.user.count({
        where: {
          ...endUserScope,
        },
      }),

      prisma.session.count({
        where: {
          expiresAt: { gt: now },
          updatedAt: { gte: activeThreshold },
          user: endUserScope,
        },
      }),

      prisma.session.findMany({
        where: {
          expiresAt: { gt: now },
          updatedAt: { gte: activeThreshold },
          user: endUserScope,
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          updatedAt: true,
          ipAddress: true,
          userAgent: true,
          user: { select: { id: true, name: true, email: true, systemRole: true } },
        },
      }),

      prisma.user.findMany({
        where: {
          ...endUserScope,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, name: true, email: true, createdAt: true },
      }),

      prisma.release.findMany({
        where: { organizationId, createdAt: { gte: today } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, status: true, createdAt: true },
      }),

      prisma.distributionJob.findMany({
        where: {
          organizationId,
          status: {
            in: [
              "PENDING", "VALIDATING", "QUEUED", "PROCESSING",
              "WAITING_PROVIDER", "RETRY_SCHEDULED", "MANUAL_REVIEW",
            ],
          },
        },
        orderBy: [{ queuedAt: "asc" }, { createdAt: "asc" }],
        take: 20,
        select: {
          id: true,
          releaseId: true,
          releaseTitle: true,
          provider: true,
          status: true,
          attemptCount: true,
          maxRetryCount: true,
          createdAt: true,
          queuedAt: true,
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

      prisma.royaltyLine.groupBy({
        by: ["countryCode"],
        where: { organizationId },
        _sum: { beneficiaryAmountMinor: true },
      }),

      prisma.smartLinkView.groupBy({
        by: ["country"],
        where: {
          organizationId,
          country: { not: null },
          isBot: false,
          createdAt: { gte: activeThreshold },
        },
        _count: { _all: true },
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

    // Ziyaretçi analizi yeni ve ikincil bir modüldür. Migration henüz
    // uygulanmamış bir sunucuda bu tabloya yapılan sorgunun tüm yönetim
    // panelini düşürmesine izin vermeyiz; çekirdek operasyon metrikleri
    // çalışmaya devam eder ve migration uygulandığında veriler otomatik gelir.
    const siteVisitTableAvailable = await siteVisitTableAvailablePromise;
    const [siteVisitorGroups, siteVisits30d, liveSiteVisits] = siteVisitTableAvailable
      ? await Promise.all([
          prisma.siteVisit.groupBy({
            by: ["visitorHash"],
            where: { organizationId, isBot: false },
          }),
          prisma.siteVisit.findMany({
            where: { organizationId, isBot: false, createdAt: { gte: thirtyDaysAgo } },
            orderBy: { createdAt: "desc" },
            take: 5000,
            select: {
              visitorHash: true,
              userId: true,
              country: true,
              city: true,
              path: true,
              createdAt: true,
              ipHash: true,
              user: { select: { name: true, email: true, systemRole: true } },
            },
          }),
          prisma.siteVisit.findMany({
            where: { organizationId, isBot: false, createdAt: { gte: activeThreshold } },
            orderBy: { createdAt: "desc" },
            take: 200,
            distinct: ["visitorHash"],
            select: {
              id: true,
              visitorHash: true,
              userId: true,
              country: true,
              city: true,
              path: true,
              createdAt: true,
              ipHash: true,
              user: { select: { name: true, email: true, systemRole: true } },
            },
          }),
        ]).catch((error) => {
          console.warn("[ADMIN_ANALYTICS] Ziyaretçi analizi geçici olarak kullanılamıyor.", error);
          return [[], [], []] as const;
        })
      : [[], [], []] as const;

    const usersToday = users.filter((user) => user.createdAt >= today).length;

    const usersSevenDays = users.filter(
      (user) => user.createdAt >= sevenDaysAgo,
    ).length;

    const dailyVisitorKeys = new Set<string>();
    for (const visit of siteVisits30d) {
      dailyVisitorKeys.add(`${dayKey(startOfDay(visit.createdAt))}:${visit.visitorHash}`);
    }
    const dailyVisitorSeries = buildDailySeries(
      Array.from(dailyVisitorKeys).map((key) => new Date(`${key.slice(0, 10)}T12:00:00.000Z`)),
      30,
    );
    const liveSiteVisitorIds = new Set(liveSiteVisits.map((visit) => visit.visitorHash));
    const liveVisitors = liveSiteVisits.map((visit) => ({
      id: visit.id,
      userId: visit.userId,
      name: visit.user?.name ?? "Anonim ziyaretçi",
      email: visit.user?.email ?? "",
      role: visit.user?.systemRole ?? "GUEST",
      ipAddress: "Gizli",
      country: countryLabel(visit.country),
      countryCode: visit.country?.trim().toUpperCase() ?? null,
      city: visit.city ?? "Bilinmiyor",
      userAgent: "Site ziyareti",
      path: visit.path,
      updatedAt: visit.createdAt.toISOString(),
    }));

    const locationHashes = Array.from(new Set(activeSessions
      .map((session) => session.ipAddress ? hashPrivacyValue(session.ipAddress) : null)
      .filter((value): value is string => Boolean(value))));
    const activeLocations = locationHashes.length
      ? await prisma.smartLinkView.findMany({
          where: {
            organizationId,
            ipHash: { in: locationHashes },
            OR: [{ country: { not: null } }, { city: { not: null } }],
          },
          orderBy: { createdAt: "desc" },
          take: 250,
          select: { ipHash: true, country: true, city: true },
        })
      : [];
    const locationByIpHash = new Map<string, { country: string; countryCode: string | null; city: string }>();
    for (const location of activeLocations) {
      if (!locationByIpHash.has(location.ipHash)) {
        const rawCountryCode = location.country?.trim().toUpperCase() ?? "";
        locationByIpHash.set(location.ipHash, {
          country: countryLabel(location.country),
          countryCode: /^[A-Z]{2}$/.test(rawCountryCode) ? rawCountryCode : null,
          city: location.city ?? "Bilinmiyor",
        });
      }
    }

    const royaltyByCountry = new Map(
      royaltyCountryRaw.map((country) => [
        country.countryCode,
        Number(country._sum.beneficiaryAmountMinor ?? 0n),
      ]),
    );
    const liveByCountry = new Map(
      liveCountryRaw
        .filter((country) => country.country)
        .map((country) => [country.country!.toUpperCase(), country._count._all]),
    );
    const siteLiveByCountry = new Map<string, number>();
    for (const visit of liveSiteVisits) {
      const code = visit.country?.trim().toUpperCase();
      if (code && /^[A-Z]{2}$/.test(code)) {
        siteLiveByCountry.set(code, (siteLiveByCountry.get(code) ?? 0) + 1);
      }
    }
    const countryCodes = new Set([
      ...countryDistributionRaw.map((country) => country.countryCode),
      ...royaltyCountryRaw.map((country) => country.countryCode),
      ...liveCountryRaw.flatMap((country) =>
        country.country ? [country.country.toUpperCase()] : [],
      ),
      ...siteLiveByCountry.keys(),
    ]);
    const countries = Array.from(countryCodes)
      .map((code) => {
        const store = countryDistributionRaw.find((item) => item.countryCode === code);
        return {
          code,
          streams: store?._sum.streamCount ?? 0,
          revenueMinor: Number(store?._sum.netRevenueMinor ?? 0n),
          royaltyMinor: royaltyByCountry.get(code) ?? 0,
          liveVisitors: Math.max(liveByCountry.get(code) ?? 0, siteLiveByCountry.get(code) ?? 0),
        };
      })
      .sort((a, b) => b.streams - a.streams || b.liveVisitors - a.liveVisitors)
      .slice(0, 20);

    return {
      generatedAt: now.toISOString(),

      summary: {
        totalUsers,
        activeUsers: Math.max(activeUsers, liveSiteVisitorIds.size),
        totalVisitors: siteVisitorGroups.length,
        activeVisitors: liveSiteVisitorIds.size,
        usersToday,
        usersSevenDays,
        releasesToday,
        pendingReleases,
        pendingApplications,
        activeDistributionJobs,
        discoverEventsToday,
        playbackToday,
      },

      details: {
        activeSessions: activeSessions.map((session) => ({
          id: session.id,
          userId: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.systemRole,
          ipAddress: maskIpAddress(session.ipAddress),
          country: session.ipAddress
            ? locationByIpHash.get(hashPrivacyValue(session.ipAddress))?.country ?? "Bilinmiyor"
            : "Bilinmiyor",
          countryCode: session.ipAddress
            ? locationByIpHash.get(hashPrivacyValue(session.ipAddress))?.countryCode ?? null
            : null,
          city: session.ipAddress
            ? locationByIpHash.get(hashPrivacyValue(session.ipAddress))?.city ?? "Bilinmiyor"
            : "Bilinmiyor",
          userAgent: session.userAgent ?? "Cihaz bilgisi yok",
          updatedAt: session.updatedAt.toISOString(),
        })),
        liveVisitors,
        recentRegistrations: recentRegistrations.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        })),
        recentReleases: recentReleases.map((release) => ({
          ...release,
          createdAt: release.createdAt.toISOString(),
        })),
        distributionQueue: distributionQueue.map((job) => ({
          ...job,
          createdAt: job.createdAt.toISOString(),
          queuedAt: job.queuedAt?.toISOString() ?? null,
        })),
      },

      charts: {
        dailyUsers: buildDailySeries(
          users.map((user) => user.createdAt),
          30,
        ),
        dailyVisitors: dailyVisitorSeries,
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
