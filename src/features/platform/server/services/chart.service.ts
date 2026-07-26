import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { z } from "zod";

const chartQuerySchema = z.object({
  type: z.enum(["GLOBAL", "COUNTRY", "TURKEY", "GENRE", "NEW_RELEASES", "TRENDING", "MOST_VOTED", "MOST_LIKED", "MOST_PLAYED", "EDITORIAL", "REWARDED_CAMPAIGN"]).default("GLOBAL"),
  countryCode: z.string().length(2).toUpperCase().optional(),
});

export class ChartService {
  async listPublic(organizationId: string, query: { type?: string; countryCode?: string }) {
    const parsed = chartQuerySchema.parse(query);
    const chart = await prisma.chart.findFirst({ where: { organizationId, chartType: parsed.type, active: true, ...(parsed.countryCode ? { countryCode: parsed.countryCode } : {}) }, include: { snapshots: { orderBy: { calculatedAt: "desc" }, take: 1, include: { entries: { orderBy: { rank: "asc" }, take: 100 } } } } });
    if (!chart || chart.snapshots.length === 0) return { chart: null, entries: [] };
    const snapshot = chart.snapshots[0];
    if (!snapshot) return { chart: null, entries: [] };
    const ids = snapshot.entries.map((entry) => entry.entityId);
    const entities = chart.entityType === "ARTIST"
      ? await prisma.artist.findMany({ where: { organizationId, id: { in: ids } }, select: { id: true, name: true, slug: true } })
      : chart.entityType === "RELEASE"
        ? await prisma.release.findMany({ where: { organizationId, id: { in: ids }, status: "LIVE" }, select: { id: true, title: true, type: true, upc: true } })
        : chart.entityType === "TRACK"
          ? await prisma.track.findMany({
              where: { organizationId, id: { in: ids }, release: { status: "LIVE" } },
              select: { id: true, title: true, release: { select: { id: true, title: true } } },
            })
          : [];
    const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
    return { chart: { id: chart.id, name: chart.name, chartType: chart.chartType, period: chart.period, entityType: chart.entityType, snapshotAt: snapshot.calculatedAt }, entries: snapshot.entries.map((entry) => ({ rank: entry.rank, previousRank: entry.previousRank, peakRank: entry.peakRank, score: entry.score.toString(), votes: entry.votes.toString(), validStreams: entry.validStreams.toString(), entity: entityMap.get(entry.entityId) ?? null })) };
  }
}

export const chartService = new ChartService();
