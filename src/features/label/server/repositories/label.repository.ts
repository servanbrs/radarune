import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { CreateLabelInput } from "@/features/label/schemas/label.schema";

export class LabelRepository {
  async listByOrganizationId(organizationId: string) {
    return prisma.label.findMany({
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
        legalName: true,
        parentLabelId: true,
        parentLabel: { select: { id: true, name: true } },
        status: true,
        createdAt: true,
        _count: {
          select: {
            artistLinks: true,
          },
        },
        artistLinks: {
          select: { id: true, artistId: true, artist: { select: { id: true, name: true, slug: true } } },
          orderBy: { artist: { name: "asc" } },
        },
      },
    });
  }

  async findBySlug(organizationId: string, slug: string) {
    return prisma.label.findUnique({
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
    input: CreateLabelInput;
    organizationId: string;
  }) {
    const { createdByUserId, input, organizationId } = params;

    return prisma.label.create({
      data: {
        organizationId,
        createdByUserId,
        name: input.name,
        slug: input.slug,
        legalName: input.legalName ?? null,
        parentLabelId: input.parentLabelId ?? null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentLabelId: true,
      },
    });
  }

  async findByOrganizationAndSlugs(organizationId: string, slugs: string[]) {
    if (slugs.length === 0) {
      return [];
    }

    return prisma.label.findMany({
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
      },
    });
  }

  async linkArtist(params: { organizationId: string; labelId: string; artistId: string }) {
    const { organizationId, labelId, artistId } = params;
    const [label, artist] = await Promise.all([
      prisma.label.findFirst({ where: { id: labelId, organizationId }, select: { id: true } }),
      prisma.artist.findFirst({ where: { id: artistId, organizationId }, select: { id: true } }),
    ]);
    if (!label || !artist) throw new Error("Label veya sanatçı bu çalışma alanında bulunamadı.");
    return prisma.labelArtist.upsert({
      where: { labelId_artistId: { labelId, artistId } },
      update: {},
      create: { labelId, artistId },
    });
  }

  async unlinkArtist(params: { organizationId: string; labelId: string; artistId: string }) {
    const { organizationId, labelId, artistId } = params;
    const label = await prisma.label.findFirst({ where: { id: labelId, organizationId }, select: { id: true } });
    if (!label) throw new Error("Label bu çalışma alanında bulunamadı.");
    return prisma.labelArtist.deleteMany({ where: { labelId, artistId } });
  }
}

export const labelRepository = new LabelRepository();
