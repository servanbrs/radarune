import "server-only";

import { prisma } from "@/server/prisma/prisma";

const AVAILABLE_CACHE_MS = 5 * 60 * 1000;
const UNAVAILABLE_CACHE_MS = 60 * 1000;

type AvailabilityCache = {
  checkedAt: number;
  available: boolean;
};

const globalForSiteVisitAvailability = globalThis as typeof globalThis & {
  radaruneSiteVisitAvailability?: AvailabilityCache;
};

/**
 * SiteVisit is an optional analytics table. Deployments can briefly run the
 * new application before its migration has completed, so check the schema
 * once and cache the result instead of throwing P2021 on every page view.
 */
export async function isSiteVisitTableAvailable() {
  const now = Date.now();
  const cached = globalForSiteVisitAvailability.radaruneSiteVisitAvailability;
  const cacheLifetime = cached?.available
    ? AVAILABLE_CACHE_MS
    : UNAVAILABLE_CACHE_MS;

  if (cached && now - cached.checkedAt < cacheLifetime) {
    return cached.available;
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ tableCount: bigint | number }>>`
      SELECT COUNT(*) AS tableCount
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND LOWER(table_name) = 'sitevisit'
    `;
    const available = Number(rows[0]?.tableCount ?? 0) > 0;
    globalForSiteVisitAvailability.radaruneSiteVisitAvailability = {
      available,
      checkedAt: now,
    };
    return available;
  } catch {
    globalForSiteVisitAvailability.radaruneSiteVisitAvailability = {
      available: false,
      checkedAt: now,
    };
    return false;
  }
}
