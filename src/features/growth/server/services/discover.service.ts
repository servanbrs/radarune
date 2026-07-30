import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { discoverEventSchema } from "@/features/growth/schemas/growth.schema";
import { recommendationService } from "@/features/growth/server/services/recommendation.service";
import { prisma } from "@/server/prisma/prisma";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

export type PublicDiscoverCandidate = {
  id: string;
  title: string;
  primaryGenre: string;
  liveAt: Date | null;
  artists: Array<{
    artist: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  score: number;
};

export type RadaruneDiscoverItem = {
  sourceType: "RADARUNE";
  id: string;
  title: string;
  artistName: string;
  primaryGenre: string;
  publishedAt: Date | null;
  thumbnailUrl: null;
  externalUrl: null;
  embedUrl: null;
  provider: "RADARUNE";
  playable: boolean;
  score: number;
  releaseId: string;
  trackId: string | null;
  externalMediaId?: null;
  likeCount?: number;
  artist: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type ExternalDiscoverItem = {
  sourceType: "EXTERNAL";
  id: string;
  title: string;
  artistName: string;
  primaryGenre: string;
  publishedAt: Date | null;
  thumbnailUrl: string | null;
  externalUrl: string;
  embedUrl: string | null;
  provider: "YOUTUBE" | "SPOTIFY";
  playable: boolean;
  score: number;
  releaseId: string | null;
  trackId: string | null;
  externalMediaId: string;
  likeCount: number;
  artist: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type DiscoverFeedItem =
  | RadaruneDiscoverItem
  | ExternalDiscoverItem;

function ageInHours(date: Date | null) {
  if (!date) {
    return 24 * 365;
  }

  return Math.max(
    0,
    (Date.now() - date.getTime()) / (60 * 60 * 1000),
  );
}

function freshnessScore(date: Date | null, maximum: number) {
  const hours = ageInHours(date);

  if (hours <= 24) return maximum;
  if (hours <= 72) return maximum * 0.8;
  if (hours <= 24 * 7) return maximum * 0.55;
  if (hours <= 24 * 30) return maximum * 0.25;

  return 0;
}

export class DiscoverService {
  async getPublicCandidates(): Promise<PublicDiscoverCandidate[]> {
  const candidates = await prisma.release.findMany({
    where: {
      status: { in: ["APPROVED", "LIVE", "DISTRIBUTED"] },
      tracks: {
        some: {},
      },
    },
    orderBy: [
      {
        liveAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: 40,
    select: {
      id: true,
      title: true,
      primaryGenre: true,
      status: true,
      liveAt: true,
      createdAt: true,
      artists: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 3,
        select: {
          artist: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      tracks: {
        select: {
          id: true,
          title: true,
          trackNumber: true,
        },
        take: 3,
      },
      _count: {
        select: {
          releaseLikes: true,
        },
      },
    },
  });

  return recommendationService
    .diversifyResults(
      candidates.map((candidate) => ({
        ...candidate,
        score:
          // Keep approved Radarune distribution above all other statuses;
          // votes then determine the order inside that tier.
          (candidate.status === "DISTRIBUTED" ? 1_000_000 : 500_000) +
          Math.min(candidate._count.releaseLikes, 1000) * 8 +
          recommendationService.scoreCandidate(candidate) +
          freshnessScore(
            candidate.liveAt ?? candidate.createdAt,
            60,
          ),
      })),
    )
    .slice(0, 6)
    .map(
  ({
    id,
    title,
    primaryGenre,
    liveAt,
    artists,
    score,
  }): PublicDiscoverCandidate => ({
    id,
    title,
    primaryGenre,
    liveAt: liveAt ?? null,
    artists,
    score,
  }),
);
}

  async getFeed(actor?: FinanceActorContext): Promise<DiscoverFeedItem[]> {
    const seenTrackIds = actor
      ? (
          await prisma.discoverEvent.findMany({
            where: {
              userId: actor.userId,
              eventType: "IMPRESSION",
            },
            select: {
              trackId: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 500,
          })
        )
          .map((event) => event.trackId)
          .filter((value): value is string => Boolean(value))
      : [];

    const organizationFilter = actor
      ? {
          organizationId: actor.organizationId,
        }
      : {};

    const [releases, externalSources] = await Promise.all([
      prisma.release.findMany({
        where: {
          ...organizationFilter,
          status: { in: ["APPROVED", "LIVE", "DISTRIBUTED"] },
          tracks: {
            some: {
              ...(seenTrackIds.length > 0
                ? {
                    id: {
                      notIn: seenTrackIds,
                    },
                  }
                : {}),
            },
          },
        },
        orderBy: [
          {
            liveAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: 60,
        select: {
          id: true,
          title: true,
          primaryGenre: true,
          status: true,
          liveAt: true,
          createdAt: true,
          tracks: {
            orderBy: {
              trackNumber: "asc",
            },
            take: 1,
            select: {
              id: true,
              title: true,
              trackNumber: true,
            },
          },
          artists: {
            orderBy: {
              sortOrder: "asc",
            },
            take: 3,
            select: {
              artist: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              releaseLikes: true,
            },
          },
        },
      }),

      prisma.externalMediaSource.findMany({
        where: {
          status: "ACTIVE",
          provider: {
            in: ["YOUTUBE", "SPOTIFY"],
          },
          // An ACTIVE source is the moderation gate.  Do not additionally
          // require playable/embeddable: YouTube and Spotify often expose a
          // valid external URL before an embed/preview is available.
          OR: [
            { playable: true },
            { externalUrl: { not: "" } },
          ],
        },
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            publishedAt: "desc",
          },
        ],
        take: 80,
        select: {
          id: true,
          provider: true,
          externalUrl: true,
          embedUrl: true,
          title: true,
          artistName: true,
          thumbnailUrl: true,
          publishedAt: true,
          playable: true,
          createdAt: true,
          releaseId: true,
          trackId: true,
          artist: { select: { id: true, name: true, slug: true } },
          _count: { select: { likes: true } },
        },
      }),
    ]);

    // Do not leave the pool empty just because this user has already seen
    // every track in the first page. Refill from the catalog in that case.
    if (releases.length === 0 && seenTrackIds.length > 0) {
      const refill = await prisma.release.findMany({
        where: { ...organizationFilter, status: { in: ["APPROVED", "LIVE", "DISTRIBUTED"] }, tracks: { some: {} } },
        orderBy: [{ liveAt: "desc" }, { createdAt: "desc" }],
        take: 60,
        select: {
          id: true, title: true, primaryGenre: true, status: true, liveAt: true, createdAt: true,
          tracks: { orderBy: { trackNumber: "asc" }, take: 1, select: { id: true, title: true, trackNumber: true } },
          artists: { orderBy: { sortOrder: "asc" }, take: 3, select: { artist: { select: { id: true, name: true, slug: true } } } },
          _count: { select: { releaseLikes: true } },
        },
      });
      releases.push(...refill);
    }

    // Discover is a public listening surface. If a member's personal
    // workspace has no live catalog yet, fall back to the public catalog
    // instead of rendering an empty pool.
    if (releases.length === 0 && actor) {
      const publicRefill = await prisma.release.findMany({
        where: { status: { in: ["APPROVED", "LIVE", "DISTRIBUTED"] }, tracks: { some: {} } },
        orderBy: [{ liveAt: "desc" }, { createdAt: "desc" }],
        take: 60,
        select: {
          id: true, title: true, primaryGenre: true, status: true, liveAt: true, createdAt: true,
          tracks: { orderBy: { trackNumber: "asc" }, take: 1, select: { id: true, title: true, trackNumber: true } },
          artists: { orderBy: { sortOrder: "asc" }, take: 3, select: { artist: { select: { id: true, name: true, slug: true } } } },
          _count: { select: { releaseLikes: true } },
        },
      });
      releases.push(...publicRefill);
    }

    const radaruneItems: RadaruneDiscoverItem[] = releases.map(
      (release) => {
        const recommendationScore =
          recommendationService.scoreCandidate(release);

        const publishedAt = release.liveAt ?? release.createdAt;
        const primaryArtist = release.artists[0]?.artist ?? null;
        // A distributed release always stays ahead of non-distributed
        // releases. Votes are the ranking signal within each tier.
        const distributionPriority = release.status === "DISTRIBUTED" ? 1_000_000 : 500_000;
        const voteScore = Math.min(release._count.releaseLikes, 1000) * 8;

        return {
          sourceType: "RADARUNE",
          id: `release:${release.id}`,
          releaseId: release.id,
          trackId: release.tracks[0]?.id ?? null,
          title: release.title,
          artistName:
            release.artists
              .map((item) => item.artist.name)
              .join(", ") || "Radarune sanatçısı",
          primaryGenre: release.primaryGenre,
          publishedAt,
          thumbnailUrl: null,
          externalUrl: null,
          embedUrl: null,
          provider: "RADARUNE",
          playable: Boolean(release.tracks[0]),
          artist: primaryArtist,
          likeCount: release._count.releaseLikes,
          score:
            distributionPriority +
            voteScore +
            freshnessScore(publishedAt, 80) +
            recommendationScore,
        };
      },
    );

    const externalItems: ExternalDiscoverItem[] =
      externalSources.map((source, index) => {
        const publishedAt = source.publishedAt ?? source.createdAt;

        /*
         * Imported provider contents initially follow their import order.
         * Recently imported items receive more weight.
         * Permanent provider chart rank will be added in the next phase.
         */
        const importOrderScore = Math.max(0, 40 - index * 0.5);

        return {
          sourceType: "EXTERNAL",
          id: `external:${source.id}`,
          releaseId: source.releaseId,
          trackId: source.trackId,
          externalMediaId: source.id,
          likeCount: source._count.likes,
          title: source.title,
          artistName:
            source.artistName ??
            (source.provider === "YOUTUBE"
              ? "YouTube sanatçısı"
              : "Spotify sanatçısı"),
          primaryGenre: "Müzik",
          publishedAt,
          thumbnailUrl: source.thumbnailUrl,
          externalUrl: source.externalUrl,
          embedUrl: source.embedUrl,
          provider: source.provider,
          playable: source.playable,
          artist: source.artist,
          score:
            25 +
            Math.min(source._count.likes, 100) * 0.8 +
            importOrderScore +
            freshnessScore(publishedAt, 35),
        };
      });

    return [...radaruneItems, ...externalItems]
      .sort((left, right) => right.score - left.score)
      .slice(0, 40);
  }

  async getCandidates(actor?: FinanceActorContext) {
    return this.getFeed(actor);
  }

  async recordEvent(
    actor: FinanceActorContext,
    input: unknown,
  ) {
    const parsed = discoverEventSchema.parse(input);

    const track = await prisma.track.findUnique({
      where: {
        id: parsed.trackId,
      },
      include: {
        release: {
          include: {
            artists: {
              take: 1,
            },
          },
        },
      },
    });

    if (!track || !["APPROVED", "LIVE", "DISTRIBUTED"].includes(track.release.status)) {
      throw new Error(
        "Discover event için uygun track bulunamadı.",
      );
    }

    return prisma.discoverEvent.create({
      data: {
        organizationId: track.organizationId,
        userId: actor.userId,
        artistId:
          track.release.artists[0]?.artistId ?? null,
        releaseId: track.releaseId,
        trackId: track.id,
        eventType: parsed.eventType,
        score: new Prisma.Decimal(0),
      },
      select: {
        id: true,
      },
    });
  }
}

export const discoverService = new DiscoverService();
