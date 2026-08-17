import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import { normalizeSlug } from "@/features/growth/lib/security.shared";

export class SocialRepository {
  async isFollowing(userId: string, artistId: string) {
    const follow = await prisma.follow.findUnique({ where: { userId_artistId: { userId, artistId } }, select: { id: true } });
    return Boolean(follow);
  }

  async addTrackToPlaylist(organizationId: string, userId: string, playlistId: string, trackId: string) {
    const playlist = await prisma.playlist.findFirst({ where: { id: playlistId, ownerUserId: userId, organizationId }, select: { id: true } });
    if (!playlist) throw new Error("Playlist bulunamadı veya bu playlist size ait değil.");
    const track = await prisma.track.findFirst({ where: { id: trackId, organizationId }, select: { id: true, releaseId: true } });
    if (!track) throw new Error("Parça bulunamadı.");
    const last = await prisma.playlistTrack.aggregate({ where: { playlistId }, _max: { sortOrder: true } });
    return prisma.playlistTrack.upsert({ where: { playlistId_trackId: { playlistId, trackId } }, update: {}, create: { playlistId, trackId, releaseId: track.releaseId, sortOrder: (last._max.sortOrder ?? -1) + 1 }, select: { id: true } });
  }
  async removeTrackFromPlaylist(userId: string, playlistId: string, trackId: string) {
    const playlist = await prisma.playlist.findFirst({ where: { id: playlistId, ownerUserId: userId }, select: { id: true } });
    if (!playlist) throw new Error("Playlist bulunamadı veya bu playlist size ait değil.");
    await prisma.playlistTrack.deleteMany({ where: { playlistId, trackId } });
    return { success: true };
  }
  async followArtist(organizationId: string, userId: string, artistId: string) {
    return prisma.follow.upsert({
      where: { userId_artistId: { userId, artistId } },
      update: {},
      create: { organizationId, userId, artistId },
      select: { id: true },
    });
  }

  async unfollowArtist(userId: string, artistId: string) {
    await prisma.follow.deleteMany({ where: { userId, artistId } });
    return { success: true };
  }

  async likeRelease(organizationId: string, userId: string, releaseId: string) {
    return prisma.releaseLike.upsert({
      where: { userId_releaseId: { userId, releaseId } },
      update: {},
      create: { organizationId, userId, releaseId },
      select: { id: true },
    });
  }

  async likeTrack(organizationId: string, userId: string, trackId: string) {
    return prisma.trackLike.upsert({
      where: { userId_trackId: { userId, trackId } },
      update: {},
      create: { organizationId, userId, trackId },
      select: { id: true },
    });
  }

  async likeExternalMedia(organizationId: string, userId: string, externalMediaId: string) {
    return prisma.externalMediaLike.upsert({ where: { userId_externalMediaId: { userId, externalMediaId } }, update: {}, create: { organizationId, userId, externalMediaId }, select: { id: true } });
  }

  async createComment(input: {
    organizationId?: string;
    authorUserId: string;
    releaseId?: string;
    trackId?: string;
    externalMediaId?: string;
    playlistId?: string;
    storyId?: string;
    parentCommentId?: string;
    content: string;
  }) {
    return prisma.comment.create({
      data: {
        organizationId: input.organizationId ?? null,
        authorUserId: input.authorUserId,
        releaseId: input.releaseId ?? null,
        trackId: input.trackId ?? null,
        externalMediaId: input.externalMediaId ?? null,
        playlistId: input.playlistId ?? null,
        storyId: input.storyId ?? null,
        parentCommentId: input.parentCommentId ?? null,
        content: input.content,
      },
      select: { id: true },
    });
  }

  async listVisibleComments(input: { releaseId?: string; trackId?: string; externalMediaId?: string }) {
    return prisma.comment.findMany({
      where: {
        status: "VISIBLE",
        parentCommentId: null,
          ...(input.trackId ? { trackId: input.trackId } : input.releaseId ? { releaseId: input.releaseId } : input.externalMediaId ? { externalMediaId: input.externalMediaId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        content: true,
        createdAt: true,
        authorUser: { select: { name: true, username: true } },
        replies: {
          where: { status: "VISIBLE" },
          orderBy: { createdAt: "asc" },
          take: 20,
          select: {
            id: true,
            content: true,
            createdAt: true,
            authorUser: { select: { name: true, username: true } },
          },
        },
      },
    });
  }

  async createPlaylist(input: {
    organizationId?: string;
    ownerUserId: string;
    name: string;
    slug?: string;
    description?: string;
    public: boolean;
  }) {
    const baseSlug = input.slug ?? normalizeSlug(input.name);
    let slug = baseSlug || undefined;
    if (slug) {
      const existing = await prisma.playlist.findUnique({ where: { slug }, select: { id: true } });
      if (existing) {
        slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`.slice(0, 80);
      }
    }
    return prisma.playlist.create({
      data: {
        organizationId: input.organizationId ?? null,
        ownerUserId: input.ownerUserId,
        name: input.name,
        slug: slug ?? null,
        description: input.description ?? null,
        public: input.public,
      },
      select: { id: true, slug: true },
    });
  }

  async listPublicPlaylists() {
    return prisma.playlist.findMany({
      where: { public: true },
      orderBy: { createdAt: "desc" },
      include: { ownerUser: { select: { name: true } }, tracks: { include: { track: true }, take: 5 } },
      take: 40,
    });
  }

  async findPublicPlaylist(slug: string) {
    return prisma.playlist.findFirst({
      where: { slug, public: true },
      include: { ownerUser: { select: { name: true } }, tracks: { include: { track: true, release: true }, orderBy: { sortOrder: "asc" } } },
    });
  }

  async findPlaylistByIdForViewer(id: string, userId: string) {
    return prisma.playlist.findFirst({
      where: { id, OR: [{ public: true }, { ownerUserId: userId }] },
      include: {
        ownerUser: { select: { name: true } },
        artist: { select: { name: true, slug: true } },
        tracks: {
          orderBy: { sortOrder: "asc" },
          include: { track: true, release: true },
        },
      },
    });
  }

  async findOwnedPlaylistById(id: string, userId: string) {
    return prisma.playlist.findFirst({
      where: { id, ownerUserId: userId },
      include: {
        ownerUser: { select: { name: true } },
        artist: { select: { name: true, slug: true } },
        tracks: {
          orderBy: { sortOrder: "asc" },
          include: { track: true, release: true },
        },
      },
    });
  }

  async listPlaylistsForViewer(organizationId: string, userId: string) {
    return prisma.playlist.findMany({
      where: { organizationId, OR: [{ ownerUserId: userId }, { public: true }] },
      orderBy: { updatedAt: "desc" },
      include: { ownerUser: { select: { name: true } }, tracks: { include: { track: true, release: true }, orderBy: { sortOrder: "asc" }, take: 5 } },
      take: 100,
    });
  }
  async updatePlaylist(userId: string, playlistId: string, input: { name: string; slug?: string; description?: string; public: boolean }) {
    const playlist = await prisma.playlist.findFirst({ where: { id: playlistId, ownerUserId: userId }, select: { id: true } });
    if (!playlist) throw new Error("Playlist bulunamadı veya bu playlist size ait değil.");
    const baseSlug = input.slug ?? normalizeSlug(input.name);
    let slug = baseSlug || undefined;
    if (slug) {
      const existing = await prisma.playlist.findFirst({ where: { slug, NOT: { id: playlistId } }, select: { id: true } });
      if (existing) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`.slice(0, 80);
    }
    return prisma.playlist.update({ where: { id: playlistId }, data: { name: input.name, slug: slug ?? null, description: input.description ?? null, public: input.public }, select: { id: true, slug: true } });
  }
  async deletePlaylist(userId: string, playlistId: string) {
    const deleted = await prisma.playlist.deleteMany({ where: { id: playlistId, ownerUserId: userId } });
    if (!deleted.count) throw new Error("Playlist bulunamadı veya bu playlist size ait değil.");
    return { success: true };
  }

  async activeStories() {
    return prisma.story.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { publishedAt: "desc" },
      include: { artist: true, release: true, smartLink: true },
      take: 30,
    });
  }

  async reportContent(input: {
    organizationId?: string;
    reporterUserId: string;
    entityType: string;
    entityId: string;
    reason: Prisma.ContentReportCreateInput["reason"];
    details?: string;
  }) {
    return prisma.contentReport.create({
      data: {
        organizationId: input.organizationId ?? null,
        reporterUserId: input.reporterUserId,
        entityType: input.entityType,
        entityId: input.entityId,
        reason: input.reason,
        details: input.details ?? null,
      },
      select: { id: true },
    });
  }
}

export const socialRepository = new SocialRepository();
