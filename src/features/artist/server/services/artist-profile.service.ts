import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { artistProfileUpdateSchema } from "@/features/artist/schemas/artist-profile.schema";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { prisma } from "@/server/prisma/prisma";

const editableTeamRoles = new Set(["OWNER", "MANAGER", "EDITOR"]);

export class ArtistProfileService {
  async get(organizationId: string, artistId: string) {
    return prisma.artist.findFirst({ where: { id: artistId, organizationId }, include: { teamMembers: { select: { userId: true, role: true } } } });
  }

  async assertEditable(input: { organizationId: string; userId: string; systemRole: string; artistId: string }) {
    const artist = await prisma.artist.findFirst({ where: { id: input.artistId, organizationId: input.organizationId }, include: { teamMembers: { where: { userId: input.userId }, select: { role: true } } } });
    if (!artist) throw new Error("Sanatçı bulunamadı.");
    const isPlatformAdmin = input.systemRole === "ADMIN" || input.systemRole === "SUPER_ADMIN";
    const isOwner = artist.ownerUserId === input.userId;
    const teamRole = artist.teamMembers[0]?.role;
    if (!isPlatformAdmin && !isOwner && (!teamRole || !editableTeamRoles.has(teamRole))) throw new Error("Bu sanatçı profilini düzenleme yetkiniz yok.");
  }

  async update(input: { organizationId: string; userId: string; systemRole: string; artistId: string; data: unknown }) {
    const parsed = artistProfileUpdateSchema.parse(input.data);
    return prisma.$transaction(async (client) => {
      const artist = await client.artist.findFirst({ where: { id: input.artistId, organizationId: input.organizationId }, include: { teamMembers: { where: { userId: input.userId }, select: { role: true } } } });
      if (!artist) throw new Error("Sanatçı bulunamadı.");
      const isPlatformAdmin = input.systemRole === "ADMIN" || input.systemRole === "SUPER_ADMIN";
      const isOwner = artist.ownerUserId === input.userId;
      const teamRole = artist.teamMembers[0]?.role;
      if (!isPlatformAdmin && !isOwner && (!teamRole || !editableTeamRoles.has(teamRole))) throw new Error("Bu sanatçı profilini düzenleme yetkiniz yok.");

      if (parsed.slug && parsed.slug !== artist.slug) {
        const duplicate = await client.artist.findFirst({ where: { organizationId: input.organizationId, slug: parsed.slug, id: { not: artist.id } }, select: { id: true } });
        if (duplicate) throw new Error("Bu sanatçı URL'si zaten kullanılıyor.");
        await client.artistSlugHistory.create({ data: { artistId: artist.id, oldSlug: artist.slug, newSlug: parsed.slug } });
      }
      const { ...updateData } = parsed;
      const updated = await client.artist.update({ where: { id: artist.id }, data: { ...(updateData as Prisma.ArtistUpdateInput), profilePublishedAt: artist.profilePublishedAt ?? new Date() }, select: { id: true, name: true, slug: true, updatedAt: true } });
      await auditLogService.create({ organizationId: input.organizationId, actorUserId: input.userId, action: "ARTIST_PROFILE_UPDATED", entityType: "Artist", entityId: artist.id, metadata: { changedFields: Object.keys(parsed), slugChanged: parsed.slug !== undefined && parsed.slug !== artist.slug } }, client);
      return updated;
    });
  }
}

export const artistProfileService = new ArtistProfileService();
