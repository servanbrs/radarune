import "server-only";
import { Prisma, type ArtistApplicationStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import type { DatabaseClient } from "@/server/prisma/database-client";

export class ArtistApplicationRepository {
  async findOpenForUser(userId: string, organizationId: string, client: DatabaseClient = prisma) {
    return client.artistApplication.findFirst({
      where: {
        userId,
        organizationId,
        status: { in: ["PENDING", "UNDER_REVIEW", "REVISION_REQUESTED"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, stageName: true },
    });
  }

  async create(input: {
    organizationId: string;
    userId: string;
    stageName: string;
    legalName: string;
    biography: string;
    spotifyArtistUrl?: string;
    appleMusicArtistUrl?: string;
    youtubeChannelUrl?: string;
  }, client: DatabaseClient = prisma) {
    return client.artistApplication.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        stageName: input.stageName,
        legalName: input.legalName,
        biography: input.biography,
        spotifyArtistUrl: input.spotifyArtistUrl || null,
        appleMusicArtistUrl: input.appleMusicArtistUrl || null,
        youtubeChannelUrl: input.youtubeChannelUrl || null,
        statusHistory: {
          create: {
            organizationId: input.organizationId,
            status: "PENDING",
            actorUserId: input.userId,
            reason: "Sanatçı başvurusu oluşturuldu.",
          },
        },
      },
      select: { id: true, status: true, stageName: true },
    });
  }
  async list(params: { organizationId: string; page: number; pageSize: number; search?: string }) {
    const where: Prisma.ArtistApplicationWhereInput = {
      organizationId: params.organizationId,
      ...(params.search
        ? {
            OR: [
              { stageName: { contains: params.search } },
              { legalName: { contains: params.search } },
              { user: { email: { contains: params.search } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.artistApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          user: { select: { id: true, name: true, email: true, systemRole: true } },
          artist: { select: { id: true, name: true } },
        },
      }),
      prisma.artistApplication.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, client: DatabaseClient = prisma) {
    return client.artistApplication.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, systemRole: true } },
        artist: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: { actorUser: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  async updateStatus(
    input: {
      id: string;
      previousStatus: ArtistApplicationStatus;
      status: ArtistApplicationStatus;
      actorUserId: string;
      reason?: string;
      adminNotes?: string;
      artistId?: string;
    },
    client: DatabaseClient,
  ) {
    const application = await client.artistApplication.update({
      where: { id: input.id },
      data: {
        status: input.status,
        reviewedByUserId: input.actorUserId,
        reviewedAt: new Date(),
        ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
        ...(input.artistId ? { artistId: input.artistId } : {}),
      },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        stageName: true,
        status: true,
      },
    });

    await client.artistApplicationStatusHistory.create({
      data: {
        organizationId: application.organizationId,
        applicationId: application.id,
        previousStatus: input.previousStatus,
        status: input.status,
        actorUserId: input.actorUserId,
        reason: input.reason ?? null,
      },
    });

    return application;
  }
}

export const artistApplicationRepository = new ArtistApplicationRepository();
