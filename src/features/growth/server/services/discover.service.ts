import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { discoverEventSchema } from "@/features/growth/schemas/growth.schema";
import { recommendationService } from "@/features/growth/server/services/recommendation.service";
import { prisma } from "@/server/prisma/prisma";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

export class DiscoverService {
  async getCandidates(actor?: FinanceActorContext) {
    const seenTrackIds = actor
      ? (
          await prisma.discoverEvent.findMany({
            where: { userId: actor.userId, eventType: "IMPRESSION" },
            select: { trackId: true },
            take: 500,
          })
        )
          .map((event) => event.trackId)
          .filter((value): value is string => Boolean(value))
      : [];

    const candidates = await prisma.release.findMany({
      where: {
        status: "LIVE",
        tracks: { some: { id: { notIn: seenTrackIds } } },
      },
      orderBy: { liveAt: "desc" },
      take: 80,
      select: {
        id: true,
        title: true,
        primaryGenre: true,
        createdAt: true,
        tracks: { select: { id: true, title: true, trackNumber: true }, take: 3 },
        artists: { select: { artist: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { releaseLikes: true } },
      },
    });

    return recommendationService
      .diversifyResults(
        candidates.map((candidate) => ({
          ...candidate,
          score: recommendationService.scoreCandidate(candidate),
        })),
      )
      .slice(0, 20);
  }

  async recordEvent(actor: FinanceActorContext, input: unknown) {
    const parsed = discoverEventSchema.parse(input);
    const track = await prisma.track.findUnique({
      where: { id: parsed.trackId },
      include: { release: { include: { artists: { take: 1 } } } },
    });
    if (!track || track.release.status !== "LIVE") {
      throw new Error("Discover event için uygun track bulunamadı.");
    }

    return prisma.discoverEvent.create({
      data: {
        organizationId: track.organizationId,
        userId: actor.userId,
        artistId: track.release.artists[0]?.artistId ?? null,
        releaseId: track.releaseId,
        trackId: track.id,
        eventType: parsed.eventType,
        score: new Prisma.Decimal(0),
      },
      select: { id: true },
    });
  }
}

export const discoverService = new DiscoverService();
