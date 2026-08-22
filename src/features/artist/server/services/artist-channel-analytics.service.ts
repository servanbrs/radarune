import "server-only";
import { artistProfileService } from "@/features/artist/server/services/artist-profile.service";
import { prisma } from "@/server/prisma/prisma";

type ArtistAnalyticsActor = {
  organizationId: string;
  userId: string;
  systemRole: string;
};

export class ArtistChannelAnalyticsService {
  async getForOwner(actor: ArtistAnalyticsActor, artistId?: string) {
    const editableIds = await artistProfileService.listEditableIds(actor);
    const requestedIds = artistId ? editableIds.filter((id) => id === artistId) : editableIds;
    if (requestedIds.length === 0) {
      throw new Error("Bu sanatçı kanalının analizlerini görüntüleme yetkiniz yok.");
    }

    const artists = await prisma.artist.findMany({
      where: { organizationId: actor.organizationId, id: { in: requestedIds } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
    const releaseLinks = await prisma.releaseArtist.findMany({
      where: {
        artistId: { in: requestedIds },
        release: { status: { in: ["APPROVED", "DISTRIBUTED", "LIVE"] } },
      },
      select: { releaseId: true, artistId: true, release: { select: { id: true, title: true } } },
    });
    const releaseIds = [...new Set(releaseLinks.map((link) => link.releaseId))];
    const trackRows = await prisma.track.findMany({
      where: { organizationId: actor.organizationId, releaseId: { in: releaseIds } },
      select: { id: true },
    });
    const trackIds = trackRows.map((track) => track.id);

    // Older generated clients may not have this optional analytics delegate yet.
    // Keep the rest of the channel page usable while that client is regenerated.
    const channelLikeDelegate = (prisma as unknown as {
      artistChannelLike?: { count: (args: unknown) => Promise<number> };
    }).artistChannelLike;

    const [followers, profileViews, uniqueViewers, streams, releaseLikes, trackLikes, channelLikes, comments] = await Promise.all([
      prisma.follow.count({ where: { organizationId: actor.organizationId, artistId: { in: requestedIds } } }),
      prisma.discoverEvent.count({ where: { organizationId: actor.organizationId, artistId: { in: requestedIds }, eventType: "PROFILE_OPEN" } }),
      prisma.discoverEvent.findMany({
        where: { organizationId: actor.organizationId, artistId: { in: requestedIds }, eventType: "PROFILE_OPEN" },
        select: { userId: true, visitorHash: true },
      }),
      prisma.playbackSession.count({ where: { organizationId: actor.organizationId, trackId: { in: trackIds }, streamCountedAt: { not: null } } }),
      prisma.releaseLike.count({ where: { organizationId: actor.organizationId, releaseId: { in: releaseIds } } }),
      prisma.trackLike.count({ where: { organizationId: actor.organizationId, trackId: { in: trackIds } } }),
      channelLikeDelegate?.count({ where: { organizationId: actor.organizationId, artistId: { in: requestedIds } } }) ?? Promise.resolve(0),
      prisma.comment.count({
        where: {
          organizationId: actor.organizationId,
          OR: [
            { releaseId: { in: releaseIds } },
            { trackId: { in: trackIds } },
            { externalMedia: { artistId: { in: requestedIds } } },
          ],
          deletedAt: null,
        },
      }),
    ]);

    const viewerKeys = new Set(uniqueViewers.map((viewer) => viewer.userId ?? viewer.visitorHash).filter(Boolean));
    const releaseSummary = releaseLinks.reduce<Array<{ id: string; title: string; artistId: string; likes: number }>>((items, link) => {
      const existing = items.find((item) => item.id === link.release.id && item.artistId === link.artistId);
      if (!existing) items.push({ id: link.release.id, title: link.release.title, artistId: link.artistId, likes: 0 });
      return items;
    }, []);
    const likeRows = releaseSummary.length
      ? await prisma.releaseLike.groupBy({ by: ["releaseId"], where: { organizationId: actor.organizationId, releaseId: { in: releaseIds } }, _count: { _all: true } })
      : [];
    const likeCounts = new Map(likeRows.map((row) => [row.releaseId, row._count._all]));
    for (const item of releaseSummary) item.likes = likeCounts.get(item.id) ?? 0;

    return {
      artists,
      summary: {
        channelCount: artists.length,
        releaseCount: releaseIds.length,
        followers,
        profileViews,
        uniqueViewers: viewerKeys.size,
        streams,
        likes: releaseLikes + trackLikes + channelLikes,
        comments,
      },
      releases: releaseSummary.sort((a, b) => b.likes - a.likes).slice(0, 10),
    };
  }
}

export const artistChannelAnalyticsService = new ArtistChannelAnalyticsService();
