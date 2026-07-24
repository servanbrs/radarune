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
        status: true,
        createdAt: true,
        _count: {
          select: {
            artistLinks: true,
          },
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
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }
}

export const labelRepository = new LabelRepository();
