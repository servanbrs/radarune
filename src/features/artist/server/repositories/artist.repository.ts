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
        createdAt: true,
        _count: {
          select: {
            labelLinks: true,
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
}

export const artistRepository = new ArtistRepository();
