import "server-only";
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
  async followArtist(actor: FinanceActorContext, artistId: string) {
    const parsed = followArtistSchema.parse({ artistId });
    const artist = await prisma.artist.findFirst({
      where: { id: parsed.artistId, organizationId: actor.organizationId },
      select: { id: true, ownerUserId: true },
    });
    if (!artist) {
      throw new Error("Sanatçı bulunamadı.");
    }
    if (artist.ownerUserId === actor.userId) {
      throw new Error("Kendi sanatçı profilinizi takip edemezsiniz.");
    }
    return socialRepository.followArtist(actor.organizationId, actor.userId, parsed.artistId);
  }

  async unfollowArtist(actor: FinanceActorContext, artistId: string) {
    return socialRepository.unfollowArtist(actor.userId, artistId);
  }

  async like(actor: FinanceActorContext, input: { releaseId?: string; trackId?: string }) {
    const parsed = likeSchema.parse(input);
    try {
      if (parsed.releaseId) {
        return await socialRepository.likeRelease(actor.organizationId, actor.userId, parsed.releaseId);
      }
      if (parsed.trackId) {
        return await socialRepository.likeTrack(actor.organizationId, actor.userId, parsed.trackId);
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
    const targetCount = [
      parsed.releaseId,
      parsed.trackId,
      parsed.playlistId,
      parsed.storyId,
    ].filter(Boolean).length;
    if (targetCount !== 1) {
      throw new Error("Yorum için tek bir hedef içerik seçilmelidir.");
    }
    return socialRepository.createComment({
      organizationId: actor.organizationId,
      authorUserId: actor.userId,
      content: parsed.content,
      ...(parsed.releaseId ? { releaseId: parsed.releaseId } : {}),
      ...(parsed.trackId ? { trackId: parsed.trackId } : {}),
      ...(parsed.playlistId ? { playlistId: parsed.playlistId } : {}),
      ...(parsed.storyId ? { storyId: parsed.storyId } : {}),
      ...(parsed.parentCommentId ? { parentCommentId: parsed.parentCommentId } : {}),
    });
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

  async getPlaylistById(userId: string, id: string) {
    return socialRepository.findPlaylistByIdForViewer(id, userId);
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
