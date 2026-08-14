import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { adminPlaylistUpdateSchema, globalPlaylistCreateSchema, globalPlaylistTrackSchema, globalPlaylistUpdateSchema, type AdminPlaylistUpdateInput, type GlobalPlaylistCreateInput, type GlobalPlaylistUpdateInput } from "@/features/growth/schemas/growth.schema";
import { globalPlaylistRepository } from "@/features/growth/server/repositories/global-playlist.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { prisma } from "@/server/prisma/prisma";

function campaignSlug(slug: string) {
  return `global-playlist-${slug}`;
}

export class GlobalPlaylistService {
  async listForAdmin(actor: FinanceActorContext) {
    assertAdminPermission(actor, "playlists:view");
    const [playlists, tracks, userPlaylists] = await Promise.all([this.listForDiscover(actor.organizationId), globalPlaylistRepository.listLiveTracks(actor.organizationId), globalPlaylistRepository.listUserPlaylists(actor.organizationId)]);
    return { playlists, tracks, userPlaylists };
  }

  async listForDiscover(organizationId: string) {
    const playlists = await globalPlaylistRepository.list();
    const slugs = playlists.map((playlist) => playlist.slug).filter((slug): slug is string => Boolean(slug));
    const campaigns = await prisma.voteCampaign.findMany({ where: { organizationId, entityType: "PLAYLIST", slug: { in: slugs.map(campaignSlug) } }, select: { id: true, slug: true, active: true, endsAt: true } });
    const campaignBySlug = new Map(campaigns.map((campaign) => [campaign.slug, campaign]));
    const counts = campaigns.length === 0 ? [] : await prisma.vote.groupBy({ by: ["campaignId"], where: { campaignId: { in: campaigns.map((campaign) => campaign.id) }, status: "VALID" }, _count: { _all: true } });
    const voteCounts = new Map(counts.map((item) => [item.campaignId, item._count._all]));
    return playlists.map((playlist) => {
      const campaign = playlist.slug ? campaignBySlug.get(campaignSlug(playlist.slug)) : undefined;
      return { ...playlist, campaign: campaign ? { ...campaign, voteCount: voteCounts.get(campaign.id) ?? 0 } : null };
    });
  }

  async create(actor: FinanceActorContext, input: GlobalPlaylistCreateInput) {
    assertAdminPermission(actor, "playlists:manage");
    const parsed = globalPlaylistCreateSchema.parse(input);
    return prisma.$transaction(async (tx) => {
      const playlist = await globalPlaylistRepository.create({ ...parsed, ownerUserId: actor.userId }, tx);
      const campaign = await tx.voteCampaign.create({ data: { organizationId: actor.organizationId, name: `${parsed.name} oylaması`, slug: campaignSlug(parsed.slug), description: `Global playlist: ${parsed.name}`, startsAt: new Date(), endsAt: parsed.voteEndsAt, entityType: "PLAYLIST", voteType: "ONE_VOTE_PER_USER", loginRequired: true, fraudProtection: true, rules: "Her giriş yapan kullanıcı bu playlist için bir oy kullanabilir.", active: parsed.votingEnabled }, select: { id: true, slug: true } });
      await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "GLOBAL_PLAYLIST_CREATED", entityType: "Playlist", entityId: playlist.id, metadata: { campaignId: campaign.id, slug: playlist.slug } }, tx);
      return { ...playlist, campaign };
    }).catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("Playlist veya oylama kısa adı zaten kullanılıyor.");
      throw error;
    });
  }

  async update(actor: FinanceActorContext, id: string, input: GlobalPlaylistUpdateInput) {
    assertAdminPermission(actor, "playlists:manage");
    const parsed = globalPlaylistUpdateSchema.parse(input);
    return prisma.$transaction(async (tx) => {
      const current = await globalPlaylistRepository.findById(id, tx);
      if (!current) throw new Error("Global playlist bulunamadı.");
      const updated = await globalPlaylistRepository.update(id, parsed, tx);
      const slug = parsed.slug ?? current.slug;
      if (!slug) throw new Error("Global playlist kısa adı bulunamadı.");
      await tx.voteCampaign.updateMany({ where: { organizationId: actor.organizationId, entityType: "PLAYLIST", slug: campaignSlug(current.slug ?? slug) }, data: { name: `${parsed.name ?? current.name} oylaması`, ...(parsed.slug ? { slug: campaignSlug(slug) } : {}), ...(parsed.voteEndsAt ? { endsAt: parsed.voteEndsAt } : {}), ...(parsed.votingEnabled !== undefined ? { active: parsed.votingEnabled } : {}) } });
      await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "GLOBAL_PLAYLIST_UPDATED", entityType: "Playlist", entityId: id, metadata: { changedFields: Object.keys(parsed) } }, tx);
      return updated;
    });
  }

  async remove(actor: FinanceActorContext, id: string) {
    assertAdminPermission(actor, "playlists:manage");
    return prisma.$transaction(async (tx) => {
      const current = await globalPlaylistRepository.findById(id, tx);
      if (!current) throw new Error("Global playlist bulunamadı.");
      if (current.slug) await tx.voteCampaign.deleteMany({ where: { organizationId: actor.organizationId, entityType: "PLAYLIST", slug: campaignSlug(current.slug) } });
      const deleted = await globalPlaylistRepository.delete(id, tx);
      await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "GLOBAL_PLAYLIST_DELETED", entityType: "Playlist", entityId: id, metadata: { name: deleted.name } }, tx);
      return deleted;
    });
  }

  async addTrack(actor: FinanceActorContext, playlistId: string, input: unknown) {
    assertAdminPermission(actor, "playlists:manage");
    const parsed = globalPlaylistTrackSchema.parse(input);
    return prisma.$transaction(async (tx) => {
      const result = await globalPlaylistRepository.addTrack(playlistId, parsed.trackId, actor.organizationId, tx);
      await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "GLOBAL_PLAYLIST_TRACK_ADDED", entityType: "Playlist", entityId: playlistId, metadata: { trackId: parsed.trackId } }, tx);
      return result;
    });
  }

  async removeTrack(actor: FinanceActorContext, playlistId: string, trackId: string) {
    assertAdminPermission(actor, "playlists:manage");
    return prisma.$transaction(async (tx) => {
      const result = await globalPlaylistRepository.removeTrack(playlistId, trackId, tx);
      await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "GLOBAL_PLAYLIST_TRACK_REMOVED", entityType: "Playlist", entityId: playlistId, metadata: { trackId } }, tx);
      return result;
    });
  }

  async updateUserPlaylist(actor: FinanceActorContext, id: string, input: AdminPlaylistUpdateInput) {
    assertAdminPermission(actor, "playlists:manage");
    const parsed = adminPlaylistUpdateSchema.parse(input);
    const current = await globalPlaylistRepository.findUserPlaylist(id, actor.organizationId);
    if (!current) throw new Error("Kullanıcı playlisti bulunamadı.");
    return globalPlaylistRepository.updateUserPlaylist(id, actor.organizationId, parsed);
  }

  async addTrackToUserPlaylist(actor: FinanceActorContext, playlistId: string, input: unknown) {
    assertAdminPermission(actor, "playlists:manage");
    const parsed = globalPlaylistTrackSchema.parse(input);
    return globalPlaylistRepository.addTrackToUserPlaylist(playlistId, parsed.trackId, actor.organizationId);
  }

  async removeTrackFromUserPlaylist(actor: FinanceActorContext, playlistId: string, trackId: string) {
    assertAdminPermission(actor, "playlists:manage");
    return globalPlaylistRepository.removeTrackFromUserPlaylist(playlistId, trackId, actor.organizationId);
  }
}

export const globalPlaylistService = new GlobalPlaylistService();
