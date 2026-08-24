import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import type { CreateArtistInput } from "@/features/artist/schemas/artist.schema";

export class ArtistRepository {
  async listByOrganizationId(
    organizationId: string,
    search?: string,
    global = false,
  ) {
    const normalizedSearch = search?.trim();

    // Hostinger veritabanında eski tablolar farklı MySQL kolasyonlarıyla
    // oluşturulmuş. Prisma'nın OR + contains sorgusu bazı alanlarda
    // `Illegal mix of collations` üretiyor. Arama adaylarını parametreli raw
    // sorguyla, tek bir kolasyona çevirerek bulup asıl kayıtları yine Prisma
    // ile çekiyoruz.
    let searchIds: string[] | undefined;
    if (normalizedSearch) {
      const pattern = `%${normalizedSearch}%`;
      const tenantClause = global
        ? Prisma.sql`1 = 1 AND`
        : Prisma.sql`a.organizationId = ${organizationId} AND`;
      const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT DISTINCT a.id
        FROM Artist AS a
        LEFT JOIN User AS owner_user ON owner_user.id = a.ownerUserId
        LEFT JOIN User AS creator_user ON creator_user.id = a.createdByUserId
        WHERE ${tenantClause} (
            CONVERT(a.name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONVERT(${pattern} USING utf8mb4) COLLATE utf8mb4_unicode_ci
            OR CONVERT(a.slug USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONVERT(${pattern} USING utf8mb4) COLLATE utf8mb4_unicode_ci
            OR CONVERT(owner_user.name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONVERT(${pattern} USING utf8mb4) COLLATE utf8mb4_unicode_ci
            OR CONVERT(owner_user.email USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONVERT(${pattern} USING utf8mb4) COLLATE utf8mb4_unicode_ci
            OR CONVERT(owner_user.username USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONVERT(${pattern} USING utf8mb4) COLLATE utf8mb4_unicode_ci
            OR CONVERT(creator_user.name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONVERT(${pattern} USING utf8mb4) COLLATE utf8mb4_unicode_ci
            OR CONVERT(creator_user.email USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONVERT(${pattern} USING utf8mb4) COLLATE utf8mb4_unicode_ci
            OR CONVERT(creator_user.username USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONVERT(${pattern} USING utf8mb4) COLLATE utf8mb4_unicode_ci
          )
      `);
      searchIds = rows.map((row) => row.id);
    }

    return prisma.artist.findMany({
      where: {
        ...(global ? {} : { organizationId }),
        ...(searchIds ? { id: { in: searchIds } } : {}),
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sortName: true,
        type: true,
        spotifyProfileUrl: true,
        appleMusicProfileUrl: true,
        profileImageUrl: true,
        coverImageUrl: true,
        profilePublishedAt: true,
        createdAt: true,
        ownerUser: { select: { id: true, name: true, email: true, username: true } },
        createdByUser: { select: { id: true, name: true, email: true, username: true } },
        _count: {
          select: {
            labelLinks: true,
            releaseArtistLinks: true,
            follows: true,
            smartLinks: true,
            applications: { where: { status: "APPROVED" } },
          },
        },
      },
    });
  }

  async findBySlug(organizationId: string, slug: string) {
    return prisma.artist.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
          slug,
        },
      },
      select: {
        id: true,
      },
    });
  }

  async create(params: {
    createdByUserId: string;
    ownerUserId?: string;
    input: CreateArtistInput;
    organizationId: string;
  }) {
    const { createdByUserId, input, organizationId } = params;

    return prisma.artist.create({
      data: {
        organizationId,
        createdByUserId,
        ownerUserId: params.ownerUserId ?? createdByUserId,
        name: input.name,
        slug: input.slug,
        sortName: input.sortName ?? null,
        type: input.type,
        spotifyProfileUrl: input.spotifyProfileUrl ?? null,
        appleMusicProfileUrl: input.appleMusicProfileUrl ?? null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }

  async findByOrganizationAndSlugs(organizationId: string, slugs: string[]) {
    if (slugs.length === 0) {
      return [];
    }

    return prisma.artist.findMany({
      where: {
        organizationId,
        slug: {
          in: slugs,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerUserId: true,
      },
    });
  }

  async listOwnedArtistIdsByUserId(userId: string) {
    return prisma.artist.findMany({
      where: {
        ownerUserId: userId,
      },
      select: {
        id: true,
      },
    });
  }

  async listFinanceAccessibleArtistIdsByUserId(
    organizationId: string,
    userId: string,
  ) {
    return prisma.artist.findMany({
      where: {
        organizationId,
        OR: [
          { ownerUserId: userId },
          {
            teamMembers: {
              some: {
                userId,
                role: { in: ["OWNER", "MANAGER", "ANALYST", "FINANCE"] },
              },
            },
          },
        ],
      },
      select: { id: true },
    });
  }

  async countByOrganizationId(organizationId: string) {
    return prisma.artist.count({
      where: {
        organizationId,
      },
    });
  }
}


export const artistRepository = new ArtistRepository();
