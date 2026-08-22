import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { artistProfileUpdateSchema } from "@/features/artist/schemas/artist-profile.schema";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { prisma } from "@/server/prisma/prisma";

const editableTeamRoles = ["OWNER", "MANAGER", "EDITOR"] as const;

type ArtistEditorActor = {
  organizationId: string;
  userId: string;
  systemRole: string;
};

type ArtistEditorTarget = ArtistEditorActor & {
  artistId: string;
};

function editableArtistScope(input: ArtistEditorActor): Prisma.ArtistWhereInput {
  const isPlatformAdmin = input.systemRole === "ADMIN" || input.systemRole === "SUPER_ADMIN";

  return {
    organizationId: input.organizationId,
    ...(isPlatformAdmin
      ? {}
      : {
          OR: [
            { ownerUserId: input.userId },
            // Eski/otomatik içe aktarımlarda kanal oluşturucusu kayıtlı kalıp
            // ownerUserId boş olabilir. Kullanıcı yalnızca kendi oluşturduğu
            // sahipsiz kanalı görür; başkasının kanalına erişim açılmaz.
            { createdByUserId: input.userId, ownerUserId: null },
            {
              teamMembers: {
                some: {
                  userId: input.userId,
                  role: { in: [...editableTeamRoles] },
                },
              },
            },
          ],
        }),
  };
}

function editableArtistWhere(input: ArtistEditorTarget): Prisma.ArtistWhereInput {
  return { id: input.artistId, ...editableArtistScope(input) };
}

export class ArtistProfileService {
  async getEditable(input: ArtistEditorTarget) {
    return prisma.artist.findFirst({
      where: editableArtistWhere(input),
      include: { teamMembers: { select: { userId: true, role: true } } },
    });
  }

  async listEditableIds(input: ArtistEditorActor) {
    const artists = await prisma.artist.findMany({
      where: editableArtistScope(input),
      select: { id: true },
    });
    return artists.map((artist) => artist.id);
  }

  async assertEditable(input: ArtistEditorTarget) {
    const artist = await prisma.artist.findFirst({
      where: editableArtistWhere(input),
      select: { id: true },
    });
    if (!artist) throw new Error("Bu sanatçı profilini düzenleme yetkiniz yok.");
  }

  async update(input: { organizationId: string; userId: string; systemRole: string; artistId: string; data: unknown }) {
    const parsed = artistProfileUpdateSchema.parse(input.data);
    return prisma.$transaction(async (client) => {
      const artist = await client.artist.findFirst({
        where: editableArtistWhere(input),
      });
      if (!artist) throw new Error("Bu sanatçı profilini düzenleme yetkiniz yok.");

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
