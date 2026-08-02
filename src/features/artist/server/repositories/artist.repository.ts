import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { CreateArtistInput } from "@/features/artist/schemas/artist.schema";

export class ArtistRepository {
  async listByOrganizationId(organizationId: string) {
    return prisma.artist.findMany({
      where: {
        organizationId,
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
        _count: {
          select: {
            labelLinks: true,
            releaseArtistLinks: true,
            follows: true,
            smartLinks: true,
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
    input: CreateArtistInput;
    organizationId: string;
  }) {
    const { createdByUserId, input, organizationId } = params;

    return prisma.artist.create({
      data: {
        organizationId,
        createdByUserId,
        ownerUserId: createdByUserId,
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

  async countByOrganizationId(organizationId: string) {
    return prisma.artist.count({
      where: {
        organizationId,
      },
    });
  }
}


export const artistRepository = new ArtistRepository();
