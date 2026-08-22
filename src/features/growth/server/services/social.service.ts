import "server-only";
import { after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { assertRateLimit } from "@/features/growth/lib/rate-limit";
import {
  contentReportSchema,
  createCommentSchema,
  createPlaylistSchema,
  followArtistSchema,
  likeSchema,
  type CreateCommentInput,
  type CreatePlaylistInput,
} from "@/features/growth/schemas/growth.schema";
import { socialRepository } from "@/features/growth/server/repositories/social.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { prisma } from "@/server/prisma/prisma";

export class SocialService {
  private async resolveChannelActor(actor: FinanceActorContext, artistId?: string) {
    if (!artistId) return null;
    const isPlatformAdmin = ["ADMIN", "SUPER_ADMIN"].includes(actor.systemRole);
    const artist = await prisma.artist.findFirst({
      where: {
        id: artistId,
        organizationId: actor.organizationId,
        ...(isPlatformAdmin
          ? {}
          : {
              OR: [
                { ownerUserId: actor.userId },
                { createdByUserId: actor.userId, ownerUserId: null },
                { teamMembers: { some: { userId: actor.userId, role: { in: ["OWNER", "MANAGER", "EDITOR"] } } } },
              ],
            }),
      },
      select: { id: true, name: true, slug: true, ownerUserId: true },
    });
    if (!artist) throw new Error("Bu sanatçı kanalı adına işlem yapma yetkiniz yok.");
    return artist;
  }

  private async notifyOwner(actor: FinanceActorContext, ownerUserId: string | null | undefined, type: string, title: string, message: string, entityType: string, entityId: string) {
    if (!ownerUserId || ownerUserId === actor.userId) return;
    await prisma.notification.create({ data: { organizationId: actor.organizationId, userId: ownerUserId, type, title, message, entityType, entityId } });
  }

  async followArtist(actor: FinanceActorContext, artistId: string) {
    const parsed = followArtistSchema.parse({ artistId });
    const artist = await prisma.artist.findFirst({
      where: { id: parsed.artistId },
      select: { id: true, ownerUserId: true, organizationId: true },
    });
    if (!artist) {
      throw new Error("Sanatçı bulunamadı.");
    }
    if (artist.ownerUserId === actor.userId) {
      throw new Error("Kendi sanatçı profilinizi takip edemezsiniz.");
    }
    return socialRepository.followArtist(artist.organizationId, actor.userId, parsed.artistId);
  }

  async unfollowArtist(actor: FinanceActorContext, artistId: string) {
    return socialRepository.unfollowArtist(actor.userId, artistId);
  }

  async like(actor: FinanceActorContext, input: { releaseId?: string; trackId?: string; externalMediaId?: string; artistId?: string }) {
    const parsed = likeSchema.parse(input);
    const channelActor = await this.resolveChannelActor(actor, parsed.artistId);
    try {
      if (parsed.releaseId) {
        const release = await prisma.release.findFirst({ where: { id: parsed.releaseId, organizationId: actor.organizationId }, select: { id: true, title: true, createdByUserId: true } });
        if (!release) throw new Error("Yayın bulunamadı.");
        const result = channelActor
          ? await socialRepository.likeReleaseAsArtist({ organizationId: actor.organizationId, artistId: channelActor.id, performedByUserId: actor.userId, releaseId: parsed.releaseId })
          : await socialRepository.likeRelease(actor.organizationId, actor.userId, parsed.releaseId);
        await this.notifyOwner(actor, release.createdByUserId, "RELEASE_LIKE", "Yayınınız beğenildi", `“${release.title}” yayınınza yeni bir beğeni geldi.`, "Release", release.id);
        return result;
      }
      if (parsed.trackId) {
        const track = await prisma.track.findFirst({ where: { id: parsed.trackId, organizationId: actor.organizationId }, select: { id: true, title: true, release: { select: { id: true, createdByUserId: true } } } });
        if (!track) throw new Error("Parça bulunamadı.");
        const result = channelActor
          ? await socialRepository.likeTrackAsArtist({ organizationId: actor.organizationId, artistId: channelActor.id, performedByUserId: actor.userId, trackId: parsed.trackId })
          : await socialRepository.likeTrack(actor.organizationId, actor.userId, parsed.trackId);
        await this.notifyOwner(actor, track.release.createdByUserId, "TRACK_LIKE", "Parçanız beğenildi", `“${track.title}” parçanıza yeni bir beğeni geldi.`, "Track", track.id);
        return result;
      }
      if (parsed.externalMediaId) {
        const media = await prisma.externalMediaSource.findFirst({ where: { id: parsed.externalMediaId, organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true } });
        if (!media) throw new Error("İçerik bulunamadı.");
        return channelActor
          ? await socialRepository.likeExternalMediaAsArtist({ organizationId: actor.organizationId, artistId: channelActor.id, performedByUserId: actor.userId, externalMediaId: parsed.externalMediaId })
          : await socialRepository.likeExternalMedia(actor.organizationId, actor.userId, parsed.externalMediaId);
      }
      throw new Error("Beğenilecek içerik bulunamadı.");
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("Bu içerik daha önce beğenilmiş.");
      }
      throw error;
    }
  }

  async comment(actor: FinanceActorContext, input: CreateCommentInput) {
    assertRateLimit(`comment:${actor.userId}`, 10, 60_000);
    const parsed = createCommentSchema.parse(input);
    const channelActor = await this.resolveChannelActor(actor, parsed.artistId);
    const targetCount = [
      parsed.releaseId,
      parsed.trackId,
      parsed.externalMediaId,
      parsed.playlistId,
      parsed.storyId,
    ].filter(Boolean).length;
    if (targetCount !== 1) {
      throw new Error("Yorum için tek bir hedef içerik seçilmelidir.");
    }
    const target = parsed.releaseId
      ? await prisma.release.findFirst({ where: { id: parsed.releaseId, organizationId: actor.organizationId }, select: { id: true, title: true, createdByUserId: true } })
      : parsed.trackId
        ? await prisma.track.findFirst({ where: { id: parsed.trackId, organizationId: actor.organizationId }, select: { id: true, title: true, release: { select: { createdByUserId: true } } } })
        : parsed.externalMediaId
          ? await prisma.externalMediaSource.findFirst({ where: { id: parsed.externalMediaId, organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true, title: true } })
          : null;
    if (!target && (parsed.releaseId || parsed.trackId || parsed.externalMediaId)) throw new Error("İçerik bulunamadı.");
    const ownerId = parsed.releaseId
      ? (target as { createdByUserId?: string | null } | null)?.createdByUserId
      : parsed.trackId && target && "release" in target
        ? (target as { release?: { createdByUserId?: string | null } }).release?.createdByUserId
        : null;
    const result = await socialRepository.createComment({
      organizationId: actor.organizationId,
      authorUserId: actor.userId,
      ...(channelActor ? { authorArtistId: channelActor.id } : {}),
      content: parsed.content,
      ...(parsed.releaseId ? { releaseId: parsed.releaseId } : {}),
      ...(parsed.trackId ? { trackId: parsed.trackId } : {}),
      ...(parsed.externalMediaId ? { externalMediaId: parsed.externalMediaId } : {}),
      ...(parsed.playlistId ? { playlistId: parsed.playlistId } : {}),
      ...(parsed.storyId ? { storyId: parsed.storyId } : {}),
      ...(parsed.parentCommentId ? { parentCommentId: parsed.parentCommentId } : {}),
    });

    if (target && !parsed.externalMediaId) {
      after(async () => {
        try {
          await this.notifyOwner(actor, ownerId, "COMMENT_CREATED", "Yeni yorum", "İçeriğinizde yeni bir yorum var.", parsed.releaseId ? "Release" : "Track", parsed.releaseId ?? parsed.trackId ?? result.id);
        } catch (error) {
          console.error("[COMMENT_NOTIFICATION] Bildirim oluşturulamadı:", error);
        }
      });
    }
    return result;
  }

  async listComments(input: { releaseId?: string; trackId?: string; externalMediaId?: string }) {
    if (!input.releaseId && !input.trackId && !input.externalMediaId) throw new Error("Yorum hedefi bulunamadı.");
    return socialRepository.listVisibleComments(input);
  }

  async createPlaylist(actor: FinanceActorContext, input: CreatePlaylistInput) {
    const parsed = createPlaylistSchema.parse(input);
    return socialRepository.createPlaylist({
      organizationId: actor.organizationId,
      ownerUserId: actor.userId,
      name: parsed.name,
      public: parsed.public,
      ...(parsed.slug ? { slug: parsed.slug } : {}),
      ...(parsed.description ? { description: parsed.description } : {}),
    });
  }

  async addTrackToPlaylist(actor: FinanceActorContext, playlistId: string, trackId: string) {
    return socialRepository.addTrackToPlaylist(actor.organizationId, actor.userId, playlistId, trackId);
  }
  async removeTrackFromPlaylist(actor: FinanceActorContext, playlistId: string, trackId: string) {
    return socialRepository.removeTrackFromPlaylist(actor.userId, playlistId, trackId);
  }
  async updatePlaylist(actor: FinanceActorContext, playlistId: string, input: CreatePlaylistInput) {
    const parsed = createPlaylistSchema.parse(input);
    return socialRepository.updatePlaylist(actor.userId, playlistId, { name: parsed.name, public: parsed.public, ...(parsed.slug ? { slug: parsed.slug } : {}), ...(parsed.description ? { description: parsed.description } : {}) });
  }
  async deletePlaylist(actor: FinanceActorContext, playlistId: string) {
    return socialRepository.deletePlaylist(actor.userId, playlistId);
  }

  async getPlaylistById(userId: string, id: string) {
    return socialRepository.findPlaylistByIdForViewer(id, userId);
  }

  async getOwnedPlaylistById(userId: string, id: string) {
    return socialRepository.findOwnedPlaylistById(id, userId);
  }

  async report(actor: FinanceActorContext, input: unknown) {
    const parsed = contentReportSchema.parse(input);
    return socialRepository.reportContent({
      organizationId: actor.organizationId,
      reporterUserId: actor.userId,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      reason: parsed.reason,
      ...(parsed.details ? { details: parsed.details } : {}),
    });
  }
}

export const socialService = new SocialService();
