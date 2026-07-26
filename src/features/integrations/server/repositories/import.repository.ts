import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class ImportRepository {
  async createSource(input: Prisma.ImportSourceUncheckedCreateInput) {
    return prisma.importSource.create({
      data: input,
      select: { id: true, name: true, type: true, provider: true, status: true, active: true },
    });
  }

  async listSources(organizationId: string) {
    return prisma.importSource.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        provider: true,
        url: true,
        artistId: true,
        active: true,
        autoPublish: true,
        requiresReview: true,
        status: true,
        lastCheckedAt: true,
        lastSuccessAt: true,
        lastError: true,
        createdAt: true,
        _count: { select: { runs: true } },
      },
    });
  }

  async listReviewItems(organizationId: string) {
    return prisma.importItem.findMany({
      where: { organizationId, status: { in: ["DETECTED", "PENDING_REVIEW"] } },
      orderBy: { detectedAt: "desc" },
      take: 100,
      select: {
        id: true,
        provider: true,
        externalId: true,
        title: true,
        artistName: true,
        durationMs: true,
        status: true,
        matchConfidence: true,
        detectedAt: true,
        source: { select: { id: true, name: true } },
        externalMediaSource: { select: { externalUrl: true, embedUrl: true, playable: true, embeddable: true } },
        matches: { select: { reason: true, confidence: true, trackId: true, releaseId: true } },
      },
    });
  }

  async findSource(organizationId: string, sourceId: string) {
    return prisma.importSource.findFirst({ where: { id: sourceId, organizationId } });
  }

  async findSourceById(sourceId: string) {
    return prisma.importSource.findUnique({ where: { id: sourceId } });
  }

  async listScheduledSources() {
    return prisma.importSource.findMany({
      where: { active: true, scheduleMode: "CRON", status: "ACTIVE" },
      select: { id: true, organizationId: true, createdByUserId: true },
    });
  }

  async claimSource(organizationId: string, sourceId: string, lockToken: string, lockExpiresAt: Date) {
    const result = await prisma.importSource.updateMany({
      where: {
        id: sourceId,
        organizationId,
        active: true,
        status: { in: ["ACTIVE", "CONFIGURATION_REQUIRED"] },
        OR: [{ lockExpiresAt: null }, { lockExpiresAt: { lt: new Date() } }],
      },
      data: { lockToken, lockExpiresAt },
    });
    return result.count === 1;
  }

  async releaseSource(organizationId: string, sourceId: string, lockToken: string, client: DatabaseClient = prisma) {
    return client.importSource.updateMany({
      where: { id: sourceId, organizationId, lockToken },
      data: { lockToken: null, lockExpiresAt: null },
    });
  }

  async createRun(input: Prisma.ImportRunUncheckedCreateInput, client: DatabaseClient = prisma) {
    return client.importRun.create({ data: input, select: { id: true, sourceId: true, status: true, startedAt: true } });
  }

  async finishRun(id: string, data: Prisma.ImportRunUncheckedUpdateInput, client: DatabaseClient = prisma) {
    return client.importRun.update({ where: { id }, data, select: { id: true, status: true, detectedCount: true, duplicateCount: true, importedCount: true, failedCount: true } });
  }

  async findExternalMedia(organizationId: string, provider: "YOUTUBE" | "SPOTIFY", externalId: string) {
    return prisma.externalMediaSource.findUnique({ where: { organizationId_provider_externalId: { organizationId, provider, externalId } } });
  }

  async findMatchingTrack(organizationId: string, title: string, durationMs: number | null) {
    return prisma.track.findFirst({
      where: {
        organizationId,
        release: { status: "LIVE" },
        title: { equals: title },
        ...(durationMs === null ? {} : { durationMs: { gte: durationMs - 2_000, lte: durationMs + 2_000 } }),
      },
      select: { id: true, releaseId: true },
    });
  }
}

export const importRepository = new ImportRepository();
